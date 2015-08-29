var socket = io();
var config={};

$(document).ready(function(){
  common_init();
});


common_init = function(){
  socket.emit("config");
};


socket.on("config",function(cfg){
  config = cfg;
  $(".header-nodename").html(config.nodename);
  $(".header-nodeip").html(config.nodeip);
});


socket.on('start-sketch', function(){
  $(".header-status").animate({color:'rgb(161, 15, 63)'}, 500 );
  $(".header-status").attr("title","Sketch is running");
});


socket.on('stop-sketch', function(){
  $(".header-status").animate({color:'rgb(10, 180, 52)'}, 500 );
  $(".header-status").attr("title","Sketch not running");
});
