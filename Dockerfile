FROM node:17-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# copying all the files from your file system to container file system
COPY package.json .

# install all dependencies
RUN npm install

# copy other files as well
COPY ./ .

# command to run when intantiate an image
CMD ["npm","start"]

ENV ENV=prod, DB_URL=<DB_URL>
