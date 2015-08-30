var lx_bulbs = {};
var tpl="";
var localtable = {};

$(document).ready(function(){
  init();
});


init = function(){
  tpl=$("#item-tpl-lifx").html();
  socket.emit("lifx-bulbs");
  socket.emit("config");
  setInterval( (function(){
    socket.emit("lifx-request-status");
  }), 5000);
}

set_lifx_color = function(color, bulb){
  set_bulb_iconcolor(color,bulb);
  socket.emit('set-lifx',{
    "bulb": bulb,
    "h":color.h,
    "s":color.s,
    "l":color.l,
    "w":color.w,
  });
};

hsl_css = function(obj){
  return 'hsl('+parseInt(obj.h)+',100%,' + parseInt( _convert( obj.l, [0,1], [0,100] ) ) + '%)';
}

calculate_bulbicon_colorcss = function(color){
  if (color.s > 0.05 && color.l > 0.05){
    var css = hsl_css(color);
  }
  else {
    var rl = (color.l<0.5) ? 0.4 : color.l;
    var l = (rl+0.3>1) ? 1 : rl+0.3;
    //var r = (color.l>0.01) ? parseInt( 255 * l ) : 11;
    //var g = (color.l>0.01) ? parseInt( 235 * l ) : 9;
    var r = parseInt( 255 * l );
    var g = parseInt( 235 * l );
    var css = 'rgb('+r+','+g+',0)';
  }
  return css;
}

set_bulb_iconcolor = function(color,bulbid){
  var target = $("#lamp_"+bulbid).find('.bulb-power-status');
  if ( target.find(".bulb-power-status").hasClass("active") ){
    target.css({ color:calculate_bulbicon_colorcss(color) } );
  }
};

socket.on("config",function(msg){
  socket.emit("lifx-gw");
});


socket.on('lifx-bulbs', function(msg){
  lx_bulbs = msg;
});

// lamp-update message from server
socket.on("lifx-bulbstatus", function(status){

  var target = $("#lamp_"+status.id);
  target.find('.bulb-lx-status').addClass("active");
  target.find('input.range-h').val(status.h);
  target.find('input.range-s').val(status.s);
  target.find('input.range-l').val(status.l);
  target.find(".spectrum-color").spectrum("set", { h:status.h, s:status.s, l:status.l });

  // this prevents false icon color if bulb is togged on by this client and an statusupdate is recived
  if (typeof localtable[status.id]!='undefined'){
    if (localtable[status.id] != status.on){
      localtable[status.id] = undefined;
      return;
    }
  }

  // lamp is on
  if (status.on==true){
    target.find('.bulb-power-status').addClass("active");
    target.find('.bulb-power-status').css({ color:calculate_bulbicon_colorcss(status) });
  }
  // lamp is off
  else if (status.on==false) {
    target.find('.bulb-power-status').removeClass("active");
    target.find('.bulb-power-status').css({ color:color_lightoff });
  }
  // no status sent, guessing from cssclass
  else {
    if ( target.find(".bulb-power-status").hasClass("active") ){
      target.find('.bulb-power-status').css({ color:calculate_bulbicon_colorcss(status) });
    }
    else {
      target.find('.bulb-power-status').css({ color:color_lightoff });
    }
  }

});


// message from server with aviable gateways
socket.on('lifx-gw', function(msg){

  var target=$(".lamp-items");
  target.html("");

  // render lamplist
  for (idx in msg){
    var item = {};
    item.item=msg[idx];
    bulbconfig = config.lifxbulbs.find( function(e) { return e.id==item.item.bulbAddress } );
    if (bulbconfig){
      item.item.name=bulbconfig.name;
    }
    for (idx in lx_bulbs){
      if (idx==item.item.bulbAddress){
        item.item.css="active";
      }
    }
    target.append( ejs.render( tpl, item ) );
  }

  // toggle single lamp status
  $(".bulb-power-status").click(function(e){
    e.preventDefault();
    var target_bulb = $(this).parent().parent().find(".lampid").html();
    if ($(this).hasClass("active")){
      socket.emit("lifx-off",{ bulbid: target_bulb });
      $(this).removeClass("active");
      localtable[target_bulb] = false;
    }
    else {
      socket.emit("lifx-on",{ bulbid: target_bulb });
      $(this).addClass("active");
      localtable[target_bulb] = true;
    }
    return false;
  });

  socket.emit("lifx-request-status");

  // color selector on each lamps detail
  $(".spectrum-color").spectrum({
    color: "#fff",
    flat: true,
    showInput: false,
    showAlpha: false,
    move: function(c) {
      var color = c.toHsl();
      var item_t = $("#lamp_"+bulb);
      color.w = item_t.find('input.range-w').val();
      item_t.find('input.range-h').val((color.h));
      item_t.find('input.range-s').val(parseFloat(color.s));
      item_t.find('input.range-l').val(parseFloat(color.l));
      var bulb=$(this).attr("bulb");
      set_lifx_color(color, bulb);
    }
  });

  // live change color
  $(".bar-color").on("input", function(e){
    var item_t = $(this).parent().parent().parent().parent();
    var bulb = item_t.find(".lampid").html()
    var color={};
    color.h = ( item_t.find('input.range-h').val() ),
    color.s = parseFloat( item_t.find('input.range-s').val() ),
    color.l = parseFloat( item_t.find('input.range-l').val() ),
    color.w = parseFloat( item_t.find('input.range-w').val() );
    item_t.find(".spectrum-color").spectrum("set", { h:color.h, s:color.s, l:color.l });
    set_lifx_color(color,bulb);
  });

  // expand lamp details
  $(".lamp-title").click(function(){
    var target = $(this).parent().find(".lamp-detail");
    if (target.is(":visible")){
      target.hide();
    }
    else {
      target.show();
      $(".spectrum-color").spectrum("reflow");
    }
  });



});



$(".btn-lamps-on").click(function(){
  socket.emit("lifx-all-on");
});


$(".btn-lamps-off").click(function(){
  socket.emit("lifx-all-off");
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
