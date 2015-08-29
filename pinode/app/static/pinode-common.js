var socket = io();
var config={};
var color_active = 'rgb(10, 180, 52)';
var color_on = 'rgb(161, 15, 63)';


$(document).ready(function(){
  common_init();
});


common_init = function(){
  socket.emit("config");
  socket.emit("status");
};

socket.on("status",function(resp){
  console.log(resp);
  if (resp.running==true){
    $(".header-status").animate({color:color_on},200);
  }
  else {
    $(".header-status").animate({color:color_active},200);
  }
});

socket.on("config",function(cfg){
  config = cfg;
  $(".header-nodename").html(config.nodename);
  $(".header-nodeip").html(config.nodeip);
});


socket.on('start-sketch', function(){
  $(".btn-stopsketch").show();
  $(".header-status").animate({color:color_on}, 500 );
  $(".header-status").attr("title","Sketch is running");
});


socket.on('stop-sketch', function(){
  $(".btn-stopsketch").hide();
  $(".header-status").animate({color:color_active}, 500 );
  $(".header-status").attr("title","Sketch not running");
});
