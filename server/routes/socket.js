'use strict';

var userCount = 0;
var councilSize = 0;
var open = {};

module.exports = function(io) {
  var report = function(question) {
      console.log('Socket: reporting question');
      if (open[question].total < 1) {
        var coinFlip = Math.floor(Math.random() * open[question].options.length);
        open[question].options[coinFlip].votes++;
      }
      io.to(question).emit('question:results', open[question]);
      delete open[question];
    };

  var checkQuestions = function() {
    if (open == {}) return;
    for (var key in open) {
      if ((Date.now() - open[key].start) > 5000) {
        report(key);
      }
    }
  };

  setInterval(checkQuestions, 500);

  var Socket = function(socket) {
    userCount++;
    io.emit('online', userCount);
    console.log('Socket: connect');

    socket.on('disconnect', function() {
      console.log('Socket: disconnect');
      userCount--;
      io.emit('online', userCount);
    });

    socket.on('question:submit', function(data) {
      console.log('Socket: question submitted');
      data.start = Date.now();
      io.to('council').emit('question', data);
      socket.join(data._id);
      data.options.forEach(function(option) {
        option.votes = 0;
      });
      data.total = 0;
      open[data._id] = data;
    });

    socket.on('join:council', function() {
      console.log('Socket: council member joined');
      socket.join('council');
      councilSize++;
    });

    socket.on('leave:council', function() {
      console.log('Socket: council member left');
      socket.join('council');
      councilSize--;
    });

    socket.on('vote', function(data) {
      console.log('Socket: council member voted');
      open[data._id].options[data.index].votes++;
      socket.join(data._id);
    });
  };

  return Socket;
};