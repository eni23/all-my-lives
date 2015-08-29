var socket = io();
var config={};
var color_on = 'rgb(161, 15, 63)';
var color_active = 'rgb(10, 180, 52)';
var color_undefined = 'rgb(187, 187, 187)';
var color_offline = 'rgb(45, 6, 237)';
var color_lighton = 'rgb(255, 230, 0)';
var color_lightoff = 'rgb(0, 0, 0)';

$(document).ready(function(){
  common_init();
});

var _convert = function( value, r1, r2 ) {
  return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
}

common_init = function(){
  socket.emit("config");
  socket.emit("status");
};


socket.on("status",function(resp){
  if (resp.running==true){
    $(".header-status").animate({color:color_on},350);
  }
  else {
    $(".header-status").animate({color:color_active},350);
  }
});


socket.on("config",function(cfg){
  config = cfg;
  $(".header-nodename").html(config.nodename);
  $(".header-nodeip").html(config.nodeip);
});


socket.on('start-sketch', function(){
  $(".btn-stopsketch").show();
  $(".header-status").animate({color:color_on}, 350 );
  $(".header-status").attr("title","Sketch is running");
});


socket.on('stop-sketch', function(){
  $(".btn-stopsketch").hide();
  $(".header-status").animate({color:color_active}, 350 );
  $(".header-status").attr("title","Sketch not running");
});
