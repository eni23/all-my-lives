$(document).ready(function(){

  loadlamps = function(){

    var target=$(".lamp-items");
    var tpl=$("#item-tpl-lifx").html();
    $.ajax({
      type: "GET",
      dataType: "json",
      url: "/lifx/list/gw",
      success : function(data){

        target.html("");
        for (item in data){
          var i = {};
          i.item=data[item];
          target.append( ejs.render( tpl, i ) );
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

  loadlamps();

});
