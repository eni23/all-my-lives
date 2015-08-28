var config={};
var socket = io();
var nodes = []
var nodetpl = "";

$(document).ready(function(){

  init = function(){

    $(document).on( "click", ".btn-enter", function(){
      var id = $(this).parent().parent().parent().attr("nodeid");
      nodes[id].socket.emit("run-enter-sketch");
    });

    $(document).on( "click", ".btn-exit", function(){
      var id = $(this).parent().parent().parent().attr("nodeid");
      nodes[id].socket.emit("run-exit-sketch");
    });

    $(document).on( "click", ".btn-stop", function(){
      var id = $(this).parent().parent().parent().attr("nodeid");
      nodes[id].socket.emit("stop-sketch");
    });

    nodetpl = $("#item-tpl-lifx").html();
    socket.emit("config");
    socket.emit("nodelist");
  };

  socket.on("config",function(msg){
    $(".header-nodename").html(msg.nodename);
    $(".header-nodeip").html(msg.nodeip);
  });

  socket.on('start-sketch', function(){
    $(".header-status").animate({color:'rgb(161, 15, 63)'}, 500 );
    $(".header-status").attr("title","Sketch is running");
  });

  socket.on('stop-sketch', function(){
    $(".header-status").animate({color:'rgb(10, 180, 52)'}, 500 );
    $(".header-status").attr("title","Sketch not running");
  });

  socket.on("nodelist",function(msg){
    var i=0;
    for (node of msg.nodes){
      var thisnode = nodes[i] = {};

      var nodeident =  { id: i, ip:node.ip, port:node.port };
      thisnode.id = i;
      thisnode.ip = node.ip;
      thisnode.port = node.port;
      thisnode.socket = io.connect('http://' + node.ip + ':' + node.port, {'force new connection': true});
      thisnode.nodename = "...";
      thisnode.socket.on("config", (function(config) {
        nodes[this.id].config = config;
        $("#node-"+this.id).find(".node-ctrl").show();
        $("#node-"+this.id).find(".nodename").html(config.nodename);
        $("#node-"+this.id).find(".node-status").removeClass("undefined").addClass("ok");
      }).bind(nodeident));

      thisnode.socket.on("connect_error", (function(err) {
        $("#node-"+this.id).find(".nodename").html(this.ip).addClass("fail");
        $("#node-"+this.id).find(".node-status").removeClass("undefined").addClass("fail");
      }).bind(nodeident));

      thisnode.socket.on('start-sketch', (function(config) {
        $("#node-"+this.id).find(".node-status").removeClass("ok").addClass("active");
      }).bind(nodeident));

      thisnode.socket.on('stop-sketch',(function(config) {
        $("#node-"+this.id).find(".node-status").removeClass("active").addClass("ok");
      }).bind(nodeident));

      thisnode.socket.emit("config");
      render_node(thisnode,$(".nodes"));

      i++;

    }
  });

  render_node = function(data, target) {
    target.append( ejs.render( nodetpl, { item: data } ) );
  }

  init();

});

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}