FROM node:10.16-alpine
WORKDIR /opt/mre

COPY package*.json lerna.json ./
COPY packages/functional-tests/package*.json ./packages/functional-tests/
COPY packages/gltf-gen/package*.json ./packages/gltf-gen/
COPY packages/sdk/package*.json ./packages/sdk/
RUN ["npm", "install", "--unsafe-perm"]

COPY tsconfig.json ./
COPY packages ./packages/
RUN npm run build-only

EXPOSE 3901/tcp
CMD ["npm", "start"]