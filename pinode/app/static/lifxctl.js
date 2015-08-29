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
  socket.emit('set-lifx',{
    "bulb": bulb,
    "h":color.h,
    "s":color.s,
    "l":color.l,
    "w":color.w
  });
};

hsl_css = function(obj){
  var s = parseInt( _convert( obj.s, [0,1], [0,100] ) );
  var l = parseInt( _convert( obj.l, [0,1], [0,100] ) );
  return 'hsl('+parseInt(obj.h)+','+s+'%,'+l+'%)';
}

set_bulb_iconcolor = function(color,iconobj,bulbid){
  if (localtable[bulbid]){
    if (!localtable[bulbid].on){
      iconobj.css({ color:hsl_css(color_lightoff) } );
      console.log("ret");
      return;
    }
  }
  if (color.s > 0.32 && color.l > 0.20){
    iconobj.css({ color:hsl_css(color) } );
  }
  else {
    iconobj.css({ color:color_lighton } );
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


  if (!localtable[status.id]){
    localtable[status.id] = status;
  }

  // ckeck against localtable for a smooth ui
  var status_wrong = false;
  for (idx in localtable[status.id]){
    if (idx == "id" || idx == "w" || idx == "a" || idx == "bulb" ){
      continue;
    }
    var localvar = localtable[status.id][idx];
    if  ( idx == "h" && parseInt(localvar)>0 && status[idx] != parseInt(localvar-1)){
      if (localvar == status[idx]) continue;
      status_wrong = { s:"hh",index:idx, me:localvar, bulb:status[idx]  };
    }
    else if ( localvar != status[idx] && ( idx != "h" || idx != "on" || idx != "s" ) ) {
      if (idx=="h"){
        continue;
      }
      if ( ( Math.round( localvar * 300 ) / 300 ) != ( Math.round( status[idx] * 300 ) / 300 ) ){
        if (idx=="h"){
          localvar=parseInt(localvar);
        }
        status_wrong = { index:idx, me:localvar, bulb:status[idx]  };
      }
    }
    else if ( localvar != status[idx] && ( idx == "s") ) {
      if ( ( Math.round( localvar * 50 ) / 50 ) != ( Math.round( status[idx] * 50 ) / 50 ) ){
        status_wrong = { index:idx, me:localvar, bulb:status[idx]  };
      }
    }
    else if ( localvar != status[idx] && ( idx == "on") ) {
      status_wrong = { index:idx, me:localvar, bulb:status[idx]  };
    }
  }
  if (status_wrong){
    localtable[status.id].bulb = status.id;
    socket.emit('set-lifx',localtable[status.id]);
    //status_wrong.msg = "bulb is wrong";
    //console.log(status_wrong);
    return;
  }
  target.find('input.range-h').val(status.h);
  target.find('input.range-s').val(status.s);
  target.find('input.range-l').val(status.l);
  target.find(".spectrum-color").spectrum("set", { h:status.h, s:status.s, l:status.l });
  localtable[status.id] = status;

  if (status.on){
    var iconcolor = color_lighton;
    if (status.s > 0.32 && status.l > 0.20){
      iconcolor = hsl_css(status);
    }
    target.find('.bulb-power-status').animate({ color:iconcolor }, 350 );
    target.find('.bulb-power-status').addClass("active");
  }
  else {
    target.find('.bulb-power-status').animate({ color:color_lightoff }, 350 );
    target.find('.bulb-power-status').removeClass("active");
  }

});

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
    flat: true,
    showInput: false,
    showAlpha: false,
    move: function(c) {
      var color = c.toHsl();
      color.w = $('input.range-w').val();
      $('input.range-h').val((color.h));
      $('input.range-s').val(parseFloat(color.s));
      $('input.range-l').val(parseFloat(color.l));
      var bulb=$(this).attr("bulb");
      set_lifx_color(color, bulb);
      var bulbicon = $("#lamp_"+bulb).find('.bulb-power-status');
      set_bulb_iconcolor(color,bulbicon,bulb);
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
    var bulbicon = item_t.find('.bulb-power-status');
    set_lifx_color(color,bulb);
    set_bulb_iconcolor(color,bulbicon,bulb);
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
    return false;
  })

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
