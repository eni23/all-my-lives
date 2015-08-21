var config={};
var socket = io();

$(document).ready(function(){


  init = function(){
    $.ajax({
      type: "GET",
      url: "/config/get",
      success : function(data){
        config=data;
        console.log(config);
        $(".header-nodename").html(data.nodename);
        $(".header-nodeip").html(data.nodeip);
        loadlamps();
      }
    });
    socket.on('start-sketch', function(){
      $(".btn-stopsketch").show();
      $(".header-status").animate({color:'rgb(161, 15, 63)'}, 500 );
      $(".header-status").attr("title","Sketch is running");
    });
    socket.on('stop-sketch', function(){
      $(".btn-stopsketch").hide();
      $(".header-status").animate({color:'rgb(10, 180, 52)'}, 500 );
      $(".header-status").attr("title","Sketch not running");
    });
  }


  loadlamps = function(){

    var target=$(".lamp-items");
    var tpl=$("#item-tpl-lifx").html();
    bulblist={};
    $.ajax({
      type: "GET",
      url: "/lifx/list",
      dataType: "json",
      success : function(data){

        bulblist=data;
        $.ajax({
          type: "GET",
          dataType: "json",
          url: "/lifx/list/gw",
          success : function(data){

            target.html("");
            for (idx in data){
              var item = {};
              item.item=data[idx];
              bulbconfig = config.lifxbulbs.find( function(e) { return e.id==item.item.bulbAddress } );
              if (bulbconfig){
                item.item.name=bulbconfig.name;
              }
              for (idx in bulblist){
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

          }
        });
      }
    });


    $(".btn-reload").click(function(){
      loadlamps();
    });

  };


  set_lifx_color = function(color, bulb){
    $.ajax('/lifx/set', {
      data: {
        "lamp": bulb,
        "h":color.h,
        "s":color.s,
        "l":color.l,
        "w":color.w,
        "t":0
      }
    });
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