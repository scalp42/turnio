FROM node:13.5

ENV token changeme

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

CMD ["node", "."]
