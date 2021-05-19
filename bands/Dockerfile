FROM node:14-alpine

WORKDIR /src

COPY /src /src/

RUN npm install
RUN npm i express
RUN npm i joi@13.1.0
RUN npm i mongoose
RUN npm i http
RUN npm i axios

EXPOSE 80

CMD ["node", "index.js"]