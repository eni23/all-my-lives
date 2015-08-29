var lx_bulbs = {};
var tpl="";

$(document).ready(function(){
  init();
});


init = function(){
  tpl=$("#item-tpl-lifx").html();
  socket.emit("lifx-bulbs");
  socket.emit("config");
}


set_lifx_color = function(color, bulb){
  socket.emit('set-lifx',{
    "bulb": bulb,
    "h":color.h,
    "s":color.s,
    "l":color.l,
    "w":color.w
  });
};


socket.on("config",function(msg){
  socket.emit("lifx-gw");
});

socket.on('lifx-bulbs', function(msg){
  lx_bulbs = msg;
});

socket.on('lifx-gw', function(msg){
  var target=$(".lamp-items");
  target.html("");
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

  $(".spectrum-color").spectrum({
    flat: true,
    showInput: false,
    showAlpha: false,
    move: function(c) {
      var color = c.toHsl();
      color.w = $('input.range-w').val();
      $('input.range-h').val(color.h);
      $('input.range-s').val(color.s);
      $('input.range-l').val(color.l);
      var bulb=$(this).attr("bulb");
      set_lifx_color(color, bulb);
    }
  });

  $(".bar-color").on("input", function(e){
    var item_t = $(this).parent().parent().parent().parent();
    var bulb = item_t.find(".lampid").html()
    var color={};
    color.h = item_t.find('input.range-h').val(),
    color.s = item_t.find('input.range-s').val(),
    color.l = item_t.find('input.range-l').val(),
    color.w = item_t.find('input.range-w').val();
    $("#spectrum-color").spectrum("set", { h:color.h, s:color.s, l:color.l });
    set_lifx_color(color,bulb);
  });

  $(".lamp-title").click(function(){
    var target = $(this).parent().find(".lamp-detail");
    if (target.is(":visible")){
      target.hide();
    }
    else {
      target.show();
    }
  });
});


$(".btn-reload").click(function(){
  init();
});


$(".btn-lamps-on").click(function(){
  socket.emit("lifx-on");
});


$(".btn-lamps-off").click(function(){
  socket.emit("lifx-off");
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
