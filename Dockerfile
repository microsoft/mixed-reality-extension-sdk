FROM node:10.16-alpine
WORKDIR /opt/mre

COPY package*.json lerna.json ./
COPY packages/altspacevr-extras/package*.json ./packages/altspacevr-extras/
COPY packages/functional-tests/package*.json ./packages/functional-tests/
COPY packages/gltf-gen/package*.json ./packages/gltf-gen/
COPY packages/sdk/package*.json ./packages/sdk/
# run this in sh so the symlinks work
RUN ["/bin/sh", "-c", "npm install --unsafe-perm"]
RUN ["/bin/sh", "-c", "node_modules/.bin/lerna bootstrap"]

COPY tsconfig.json ./
COPY packages ./packages/
RUN npm run build-only

EXPOSE 3901/tcp
CMD ["npm", "start"]