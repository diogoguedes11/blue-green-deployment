FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./ 
RUN npm install
COPY . .
ENV APP_VERSION=v1
EXPOSE 3000
CMD ["npm", "start"]
