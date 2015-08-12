/*
*
*/
var config = {};
var files = {};
var tpl = {};
var lifx_colorsel_elem=false;

$(document).ready(function(){
  var list=$(".drag-ul-enter").get(0)
  var sortable = Sortable.create(list)


  init = function(){

    var enter_list=$(".drag-ul-enter").get(0),
        enter_sortable = Sortable.create(enter_list),
        exit_list=$(".drag-ul-exit").get(0),
        exit_sortable = Sortable.create(exit_list);

    $.ajax({
      type: "GET",
      url: "/config/get",
      async: false,
      success : function(data){
        config = data ;
      }
    });

    $.ajax({
        type: "GET",
        url: "/config/status",
        success : function(data){
          if (data.enabled==true){
            $(".btn-onoff").addClass("btn-success");
            $(".btn-onoff").removeClass("btn-danger");
            $(".btn-onoff").text("Enabled");
          }
          if (data.enabled==false){
            $(".btn-onoff").addClass("btn-danger");
            $(".btn-onoff").removeClass("btn-success");
            $(".btn-onoff").text("Disabled");
          }
        }
    });


    update_filelist();

    tpl.lifx = $("#item-tpl-lifx").html()
    tpl.dmx = $("#item-tpl-dmx").html()
    tpl.audio = $("#item-tpl-audio").html()
    tpl.video = $("#item-tpl-video").html()
    tpl.delay = $("#item-tpl-delay").html()
    tpl.script = $("#item-tpl-script").html()

    $.ajax({
      "method": "GET",
      "url": "/sketch/enter/get",
      success: function(data){
        render_sketch(data, $(".drag-ul-enter"));
      }
    });

    $.ajax({
      "method": "GET",
      "url": "/sketch/exit/get",
      success: function(data){
        render_sketch(data, $(".drag-ul-exit"));
      }
    });

    $(document).on( "click", ".item-delete", function(){
      var elem=$(this).parent().parent().parent();
      elem.remove();
    });


    $(document).on( "click", ".lifx-colorsel", function(){
      lifx_colorsel_elem = $(this).parent().parent().parent();
      var h=lifx_colorsel_elem.find(".lifx-h").val(),
          s=lifx_colorsel_elem.find(".lifx-s").val(),
          l=lifx_colorsel_elem.find(".lifx-l").val(),
          w=lifx_colorsel_elem.find(".lifx-w").val();
      $(".modal-lifx-color-h").val( h )
      $(".modal-lifx-color-s").val( s )
      $(".modal-lifx-color-l").val( l )
      $(".modal-lifx-color-w").val( w )
      $("#spectrum-color").spectrum("set", { h:h, s:s, l:l });
      $("#modal-lifx-color").modal();
    });

    $(".new-item-enter").click(function(){
      new_item(this, $(".drag-ul-enter"));
    })
    $(".new-item-exit").click(function(){
      new_item(this, $(".drag-ul-exit"));
    })

    $(".btn-onoff").click(function(){
      stat=""
      $.ajax({
        type: "GET",
        url: "/config/status",
        async: false,
        success : function(data){
          if (data.enabled==true){
            $(".btn-onoff").addClass("btn-danger");
            $(".btn-onoff").removeClass("btn-success");
            $(".btn-onoff").text("Disabled");
            $.ajax({
              type: "GET",
              url: "/config/disable"
            });
          }
          if (data.enabled==false){
            $(".btn-onoff").addClass("btn-success");
            $(".btn-onoff").removeClass("btn-danger");
            $(".btn-onoff").text("Enabled");
            $.ajax({
              type: "GET",
              url: "/config/enable"
            });
          }
        }
      });
    });


    $(".btn-save").click(function(){
      var enter = sketch_to_json( $(".drag-ul-enter") );
      var exit = sketch_to_json( $(".drag-ul-exit") );
      var data = {
        enter: enter,
        exit: exit
      }
      $.ajax({
        type: "POST",
        url: "/sketch/update",
        contentType: 'application/json',
        data: JSON.stringify(data),
        success : function(re){
          console.log(re)
        }
      });
    })
  }


  new_item = function( e, target ){

    var evt=$(e);

    if (evt.hasClass("new-item-lifx")){
      var data = [ { type:"lifx", name:"", bulb:0, h:0, s:0, l:0, w:0, t:0, blocking:false } ];
    }
    else if (evt.hasClass("new-item-dmx")){
      var data = [ { type:"dmx", name:"", channel:0, start:0, end:0, duration:0, blocking:false } ];
    }
    else if (evt.hasClass("new-item-audio")){
      var data = [ { type:"audio", name:"", sink:0, file:0, blocking:false } ];
    }
    else if (evt.hasClass("new-item-video")){
      var data = [ { type:"video", name:"", file:0, blocking:false } ];
    }
    else if (evt.hasClass("new-item-delay")){
      var data = [ { type:"delay", duration:0 } ];
    }
    else if (evt.hasClass("new-item-script")){
      var data = [ { type:"script", cmd:"/usr/bin/false", blocking:false } ];
    }
    render_sketch(data, target);
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

    for (item of data) {

      switch (item.type) {

        case "lifx":
          item.lamps=config.lifxbulbs
          target.append( ejs.render( tpl.lifx, item ) );
          break;

        case "dmx":
          target.append( ejs.render( tpl.dmx, item ) );
          break;

        case "audio":
          item.files = files.audio;
          item.sinks = config.audiosinks;
          target.append( ejs.render( tpl.audio, item ) );
          break;

        case "video":
          item.files = files.video;
          target.append( ejs.render( tpl.video, item ) );
          break;

        case "delay":
          target.append( ejs.render( tpl.delay, item ) );
          break;

        case "script":
          target.append( ejs.render( tpl.script, item ) );
          break;

        default:
          break;

      }
    }
  }

  sketch_to_json = function( source ) {

    sketch = [];

    source.children("li").each(function(){
      elem = $(this);

      if (elem.hasClass("item-lifx")){
          var item = {};
          item.type="lifx";
          item.name = elem.find(".item-desc").val();
          item.bulb = elem.find(".lifx-bulb").val();
          item.h = elem.find(".lifx-h").val();
          item.s = elem.find(".lifx-s").val();
          item.l = elem.find(".lifx-l").val();
          item.w = elem.find(".lifx-w").val();
          item.t = elem.find(".lifx-t").val();

          if( elem.find(".blocking").is(':checked')) {
            item.blocking=true;
          }
          else {
            item.blocking=false;
          }

          sketch.push(item);
      }

      else if (elem.hasClass("item-dmx")) {
          var item = {};
          item.type="dmx";
          item.name = elem.find(".item-desc").val();
          item.channel = elem.find(".dmx-channel").val();
          item.start = elem.find(".dmx-start").val();
          item.end = elem.find(".dmx-end").val();
          item.duration = elem.find(".dmx-duration").val();
          if( elem.find(".blocking").is(':checked')) {
            item.blocking=true;
          }
          else {
            item.blocking=false;
          }
          sketch.push(item);
      }

      else if (elem.hasClass("item-video")) {
          var item = {};
          item.type="video";
          item.name = elem.find(".item-desc").val();
          item.file = elem.find(".video-file").val();
          if( elem.find(".blocking").is(':checked')) {
            item.blocking=true;
          }
          else {
            item.blocking=false;
          }
          sketch.push(item);

      }

      else if (elem.hasClass("item-audio")) {
          var item = {};
          item.type="audio";
          item.name = elem.find(".item-desc").val();
          item.file = elem.find(".audio-file").val();
          item.sink = elem.find(".audio-sink").val();
          if( elem.find(".blocking").is(':checked')) {
            item.blocking=true;
          }
          else {
            item.blocking=false;
          }
          sketch.push(item);
      }

      else if (elem.hasClass("item-delay")) {
          var item = {};
          item.type="delay";
          item.name = elem.find(".item-desc").val();
          item.duration = elem.find(".delay-duration").val();
          if( elem.find(".blocking").is(':checked')) {
            item.blocking=true;
          }
          else {
            item.blocking=false;
          }
          sketch.push(item);
      }

      else if (elem.hasClass("item-script")) {
          var item = {};
          item.type="script";
          item.name = elem.find(".item-desc").val();
          item.cmd = elem.find(".script-cmd").val();
          if( elem.find(".blocking").is(':checked')) {
            item.blocking=true;
          }
          else {
            item.blocking=false;
          }
          sketch.push(item);
      }

    });

    return sketch;
  }


  set_lifx_color = function(color){

    var lamp=lifx_colorsel_elem.find(".lifx-bulb").val();
    console.log(lamp);

    $.ajax('/lifx/set', {
      data: {
        "lamp": lamp,
        "h":color.h,
        "s":color.s,
        "l":color.l,
        "w":color.w,
        "t":0
      }
    });
  }

  update_lifx_item_color = function(color){
    lifx_colorsel_elem.find(".lifx-h").val(color.h);
    lifx_colorsel_elem.find(".lifx-s").val(color.s);
    lifx_colorsel_elem.find(".lifx-l").val(color.l);
    lifx_colorsel_elem.find(".lifx-w").val(color.w);
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
      update_lifx_item_color(color);
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
    update_lifx_item_color(color);
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
