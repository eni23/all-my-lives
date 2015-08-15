/*
*
*/
var config = {};
var files = {};
var tpl = {};
var lifx_colorsel_elem=false;
var dmx_valsel_elem=false;
var disable_autosave=false;

$(document).ready(function(){


  init = function(){

    sortable_opts = {
      onEnd: function (evt) {
        autosave();
      },
      handle: ".item-sort-icon",
      //draggable: ".sketch-item"
    }
    Sortable.create($(".drag-ul-enter")[0],sortable_opts);
    Sortable.create($(".drag-ul-exit")[0],sortable_opts);

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
      autosave();
    });

    $(document).on( "click", ".dmx-valsel", function(){
      dmx_valsel_elem = $(this).parent().parent().parent();
      $(".modal-dmx-value-val").val( dmx_valsel_elem.find(".dmx-end").val() );
      $("#modal-dmx-value").modal();
      disable_autosave=true;
    });

    $('#modal-dmx-value,#modal-lifx-color').on('hidden.bs.modal', function () {
        disable_autosave=false;
        autosave();
    })



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
      disable_autosave=true;
      $("#modal-lifx-color").modal();
    });

    $(document).on( "click", ".item-test-single", function(){
      var elem=$(this).parent().parent().parent();

      var data=sketch_to_json(elem);
      $.ajax({
        type: "POST",
        contentType: 'application/json',
        data: JSON.stringify(data),
        url: "/sketch/test-single",
        success : function(data){
          console.log(data);
        }
      });
      return false;

    });

    $(".new-item-enter").click(function(){
      new_item(this, $(".drag-ul-enter"));
      animate_item($(".drag-ul-enter>li:last"));
      autosave();
    })
    $(".new-item-exit").click(function(){
      new_item(this, $(".drag-ul-exit"));
      animate_item($(".drag-ul-exit>li:last"));
      autosave();
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

    $(".btn-stopsketch").click(function(){
      $.ajax('/sketch/stop');
    });

    $(".test-enter").click(function(){
      $.ajax('/sketch/test-enter');
    });

    $(".test-exit").click(function(){
      $.ajax('/sketch/test-exit');
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
    });

    //autosave
    $(document).on( "change", "input", function(){
      if (disable_autosave==true){
        return;
      }
      autosave();
    });

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
    });

    $(".bar-color").on("input", function(e){
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

    $(".bar-dmx").on("input", function(e){
      var value=$(".modal-dmx-value-val").val(),
          channel=dmx_valsel_elem.find(".dmx-channel").val();
      dmx_valsel_elem.find(".dmx-end").val( value );
      $.ajax('/dmx/set', {
        data: {
          "channel": channel,
          "value":value
        }
      });
    });


  }

  animate_item = function(item){
    var savecolor=item.css("backgroundColor");
    $('html, body').animate({
          scrollTop: item.offset().top
        }, 200, function() {
          item.animate({
            backgroundColor:'#72f77f'},200, function(){
              item.animate({backgroundColor:savecolor},300 );
          });
      });
  }

  autosave = function(){
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

    if (source.children("li").length==0){
      var list=source;
    }
    else {
      source.children("li")
      var list=source.children("li")
    }

    list.each(function(){
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





  init();

});
