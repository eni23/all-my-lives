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
  var saveon = localtable[bulb].on;
  localtable[bulb] = color;
  localtable[bulb].on = saveon;
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
  //var s = parseInt( _convert( obj.s, [0,1], [0,100] ) );
  //var l = parseInt( _convert( obj.l, [0,1], [0,100] ) );
  return 'hsl('+parseInt(obj.h)+',100%,' + parseInt( _convert( obj.l, [0,1], [0,100] ) ) + '%)';
}

set_bulb_iconcolor = function(color,bulbid){
  var target = $("#lamp_"+bulbid).find('.bulb-power-status');
  if (color.s > 0.05 && color.l > 0.05){
    target.css({ color:hsl_css(color) } );
  }
  else {
    var rl = (color.l<0.5) ? 0.4 : color.l;
    var l = (rl+0.3>1) ? 1 : rl+0.3;
    var r = (color.l>0.05) ? parseInt( 255 * l ) : 0;
    var g = (color.l>0.05) ? parseInt( 235 * l ) : 0;
    var rgb = 'rgb('+r+','+g+',0)';
    console.log(rgb);
    target.css({ color:rgb } );
  }
};

socket.on("config",function(msg){
  socket.emit("lifx-gw");
});


socket.on('lifx-bulbs', function(msg){
  lx_bulbs = msg;
});

socket.on("lifx-bulbstatus", function(status){
  var target = $("#lamp_"+status.id);
  target.find('.bulb-lx-status').addClass("active");
  target.find('input.range-h').val(status.h);
  target.find('input.range-s').val(status.s);
  target.find('input.range-l').val(status.l);
  target.find(".spectrum-color").spectrum("set", { h:status.h, s:status.s, l:status.l });
  localtable[status.id] = status;

  if (status.on==true){
    if (status.s > 0.05 && status.l > 0.05){
      var iconcolor = hsl_css(status);
    }
    else {
      var color=status;
      var rl = (color.l<0.5) ? 0.4 : color.l;
      var l = (rl+0.3>1) ? 1 : rl+0.3;
      var r = (color.l>0.05) ? parseInt( 255 * l ) : 0;
      var g = (color.l>0.05) ? parseInt( 235 * l ) : 0;
      var iconcolor = 'rgb('+r+','+g+',0)';
    }
    target.find('.bulb-power-status').animate({ color:iconcolor }, 50 );
    target.find('.bulb-power-status').addClass("active");
  }
  else if (status.on==false) {
    target.find('.bulb-power-status').animate({ color:color_lightoff }, 50 );
    target.find('.bulb-power-status').removeClass("active");
  }
});
$(".bulb-power-status").click(function(e){
  e.preventDefault();
  var target_bulb = $(this).parent().parent().find(".lampid").html();
  if ($(this).hasClass("active")){
    socket.emit("lifx-off",{ bulbid: target_bulb });
    $(this).removeClass("active");
    $(this).animate({ color:color_lightoff }, 450 );
    localtable[target_bulb].on = false;
  }
  else {
    socket.emit("lifx-on",{ bulbid: target_bulb });
    $(this).addClass("active");
    $(this).animate({ color:color_lighton }, 450 );
    localtable[target_bulb].on = true;
  }
  //socket.emit("lifx-request-status");
  return false;
})

socket.on('lifx-gw', function(msg){

  var target=$(".lamp-items");
  target.html("");

  for (idx in msg){
    var item = {};
    item.item=msg[idx];
    //ct[item.item.bulbAddress] = false;
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
  socket.emit("lifx-request-status");

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


$(".btn-reload").click(function(){
  init();
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
