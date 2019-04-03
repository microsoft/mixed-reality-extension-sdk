General Flow
=============

On start:

1. `MultipeerAdapter::listen` creates HTTP server
2. `MultipeerAdapter::startListening` creates WebSocket server, registers preconnect checks

On connection:

1. WebSocket server callback creates new `Websocket` and `Client` objects
2. `MultipeerAdapter::joinClientToSession` runs `ClientHandshake` and `ClientStartup` protocols
3. If the session doesn't yet exist:
    1. Create a new `Pipe` that forwards events from the session to the context and back
    2. Create new `Context` and `InternalContext::startListening`
        1. Run `Handshake`
        2. Register new `Execution` protocol and `startListening`
    3. Create new `Session` and `Session::connect`
        1. Run `SessionHandshake`
        2. Run `SessionSync`
        3. Register new `SessionExecution` and `startListening`
    4. `InternalContext::start`
        1. Start context's update loop
        2. Emit the `started` event, signaling app start. This will likely result in an initial batch of messages establishing session state.
4. `Session::join` calls `Client::join`
    1. Run `ClientSync` to re-send session state messages
    2. Register new `ClientExecution` protocol and `startListening`

On message expecting a reply:

1. `InternalContext::createActorFromPayload` with a `CreateEmpty` payload or similar
2. `Execution::sendPayload` calls `Execution::sendMessage`
3. `Execution::sendMessage` runs middlewares
    1. `ServerPreprocessing::beforeSend` adds `serverTimeMs` to messages if not present
4. `Execution::sendMessage` stores reply callbacks on the connection
5. `Execution#conn::send` message flows to `SessionExecution::recvMessage`
6. `SessionExecution::recvMessage` runs middlewares
    1. `ClientPreprocessing::beforeRecv` updates connection latency and auto-replies to heartbeats
    2. `SessionExecution::beforeRecv` kills normal flow and emits a `recv` event
7. `recv` picked up by `Session::recvFromApp`
8. `Session::preprocessFromApp`
    1. Look up rule for payload type from `Rules`
    2. `Rule#session::beforeReceiveFromApp`
    3. For `CreateEmpty` messages, `Session::cacheCreateActorMessage` caches actor creation message for replay during syncing
9. `Session::sendToClients` if the preprocessor did not cancel the send
10. Clients filtered by filter function (only used by `SetAnimationState` messages as of writing)
11. For each client that passes the filter:
    1. `Client::send` calls `ClientExecution::sendMessage`
    2. `ClientExecution::sendMessage` runs middlewares
        1. `ServerPreprocessing::beforeSend` adds `serverTimeMs` to messages if not present
    4. `ClientExecution#conn::send` sends message over the websocket
    5. The remote client does some work, and sends an `ObjectSpawned` message
    6. `ClientExecution::onReceive` calls `ClientExecution::recvMessage`
    7. `ClientExecution::recvMessage` runs middlewares
        1. `ClientExecution::beforeRecv` continues standard protocol flow if there's a callback waiting for this message, which never happens when messages come from a session. In this case, flow goes to `ClientExecution::handleReplyMessage` if there is a reply ID indicated, or `ClientExecution::recvPayload` if not.
    8. `ClientExecution::beforeRecv` emits `recv` event
    9. `recv` picked up by `Session::recvFromClient`
    10. `Session::preprocessFromClient`
        1. Look up rule for payload type from `Rules`
        2. `Rule#session::beforeReceiveFromClient`
        3. For `ObjectSpawned` messages, if from authoritative peer, copy each returned actor description into the session state and continue to send message to app. Otherwise stop processing this message.
12. `Session::sendToApp` calls `SessionExecution::sendMessage` if preprocessor did not cancel the send
13. `SessionExecution::sendMessage` runs middlewares (no-op)
14. `SessionExecution#conn::send` message flows to `Execution::recvMessage`
15. `Execution::recvMessage` runs middlewares (no-op)
16. `Execution::handleReplyMessage` calls reply callback:
17. `InternalContext::createActorFromPayload`
