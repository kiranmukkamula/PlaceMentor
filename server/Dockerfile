FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["npm", "start"]