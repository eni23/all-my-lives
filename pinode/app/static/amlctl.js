var nodes = []
var nodetpl = "";

$(document).ready(function(){
  init();
});


render_node = function(data, target) {
  target.append( ejs.render( nodetpl, { item: data } ) );
}


init = function(){
  nodetpl = $("#item-tpl-pinode").html();
  socket.emit("config");
  socket.emit("nodelist");
};


socket.on("nodelist",function(msg){

  $(".nodes").html("");
  var i=0;

  for (idx in msg.nodes){
    var node=msg.nodes[idx];
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
      $("#node-"+this.id).find(".nodename").html(this.ip+" is offline").addClass("fail");
      $("#node-"+this.id).find(".node-status").removeClass("undefined").addClass("fail");
    }).bind(nodeident));

    thisnode.socket.on('start-sketch', (function(config) {
      $("#node-"+this.id).find(".node-status").removeClass("ok").addClass("active");
    }).bind(nodeident));

    thisnode.socket.on('stop-sketch',(function(config) {
      $("#node-"+this.id).find(".node-status").removeClass("active").addClass("ok");
    }).bind(nodeident));

    thisnode.socket.on('status',(function(status) {
      if (status.running){
        $("#node-"+this.id).find(".node-status").removeClass("ok").addClass("active");
      }
      else {
        $("#node-"+this.id).find(".node-status").removeClass("active").addClass("ok");
      }
    }).bind(nodeident));

    thisnode.socket.emit("config");
    render_node(thisnode,$(".nodes"));
    thisnode.socket.emit("status");

    i++;
  };

});


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
