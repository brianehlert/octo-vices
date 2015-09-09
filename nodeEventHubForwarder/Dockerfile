# this builds a single container to run the event hub forwarder
# sudo docker build github.com/brianehlert/octo-vices.git
# sudo docker images   ( find the image ID )
# sudo docker run -t <image id>

# latest ubuntu image
FROM node:latest

MAINTAINER BrianEh

# make sure that NPM is at the latest
RUN npm -g update npm

# directories
RUN mkdir /opt/ehf

# copy the pull to /opt/ehf (this should not copy everything)
COPY . /opt/ehf/

# install the eventHubForwarder
RUN cd /opt/ehf && npm install --production --loglevel warn

# Run the app
CMD ["node", "/opt/ehf/eventHubForwarder.js"]
