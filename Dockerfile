FROM node:8.11.3

# WORKDIR /usr/src/app

ENV DB_SERVER "mongo"

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]