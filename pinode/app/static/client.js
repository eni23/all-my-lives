/*
*
*/
var config = {};
var files = {};

$(document).ready(function(){
  var list=$(".drag-ul-enter").get(0)
  var sortable = Sortable.create(list)


  init = function(){

    var list=$(".drag-ul-enter").get(0),
        sortable = Sortable.create(list)

    $.ajax({
      type: "GET",
      url: "/config/get",
      async: false,
      success : function(data){
        config = data ;
      }
    });
    update_filelist();

    $.ajax({
      "method": "GET",
      "url": "/sketch/enter/get",
      success: function(data){
        render_sketch(data, $(".drag-ul-enter"));
      }
    });

  }


  update_filelist = function(){
    $.ajax({
      type: "GET",
      url: "/config/files",
      async: false,
      success : function(data){
        files = data;
      }
    });
  }

  render_sketch = function( data , target ){

    var tpl = {}
    tpl.lifx = $("#item-tpl-lifx").html()
    tpl.dmx = $("#item-tpl-dmx").html()
    tpl.audio = $("#item-tpl-audio").html()
    tpl.video = $("#item-tpl-video").html()
    tpl.delay = $("#item-tpl-delay").html()
    tpl.script = $("#item-tpl-script").html()


    for (item of data) {

      switch (item.type) {

        case "lifx":
          item.lamps=config.lifxbulbs
          var html = ejs.render( tpl.lifx, item );
          target.append(html)
          break;

        case "dmx":
          var html = ejs.render( tpl.dmx, item );
          target.append(html)
          break;

        case "audio":
          item.files = files.audio;
          item.sinks = config.audiosinks;
          var html = ejs.render( tpl.audio, item );
          target.append(html)
          break;

        case "video":
          item.files = files.video;
          var html = ejs.render( tpl.video, item );
          target.append(html)
          break;

        case "delay":
          var html = ejs.render( tpl.delay, item );
          target.append(html)
          break;

        case "script":
          var html = ejs.render( tpl.script, item );
          target.append(html)
          break;

        default:
          break;

      }
    }
  }

  set_lifx_color = function(color){
    $.ajax('/lifx/set', {
      data: {
        "h":color.h,
        "s":color.s,
        "l":color.l,
        "w":color.w,
        "t":0
      }
    });
  }


  $("#spectrum-color").spectrum({
    flat: true,
    showInput: false,
    showAlpha: false,
    move: function(c) {
      var color = c.toHsl();
      color.w = $('input.range-w').val();
      $('input.range-h').val(color.h);
      $('input.range-s').val(color.s);
      $('input.range-l').val(color.l);
      if( $("#lifx-color-cb-live").is(':checked')) {
        set_lifx_color(color);
      }
    }
  })
  $(".bar").on("input", function(e){
    var color={};
    color.h = $('input.range-h').val(),
    color.s = $('input.range-s').val(),
    color.l = $('input.range-l').val(),
    color.w = $('input.range-w').val();
    $("#spectrum-color").spectrum("set", { h:color.h, s:color.s, l:color.l });
    if( $("#lifx-color-cb-live").is(':checked')) {
      set_lifx_color(color);
    }
  });



  //var item_lifx = $("#item-tpl-lifx").html()
  //var html = ejs.render(item_lifx, data);

  /*$('input.bar').on('slide',function(){
  var h = $('input.range-h').val(),
  s = $('input.range-s').val(),
  l = $('input.range-l').val(),
  w = $('input.range-w').val(),
  t = $('input.range-t').val();
  console.log(s);
  $.ajax('/lifx/set', {
  data: {
  "h":h,
  "s":s,
  "l":l,
  "w":w,
  "t":t
  }
  });
  });

  $('input.bar').slider();
  */
  //console.log(html);

  init();

});
