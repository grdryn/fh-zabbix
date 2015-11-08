FROM mhart/alpine-node

COPY . /src

WORKDIR /src
CMD npm start
