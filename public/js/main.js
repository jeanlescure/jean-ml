$(function(){
  $('.error').hide();

  $('#urlForm').submit(function(e){
    e.preventDefault();

    $('.error').html('');
    $('.error').hide();

    $.ajax({
      type: "POST",
      url: '/create',
      data: {
        url: $('#urlForm input').val(),
        access_token: access_token
      },
      success: function(data) {
        $('.meta-items').prepend(data.meta_item);
      },
      error: function(err) {
        $('.error').show();
        $('.error').html(err.responseText);
      },
      dataType: 'json'
    });
  });

  $('#urlForm button').click(function(e){
    e.preventDefault();

    $('#urlForm').submit();
  });

  new Clipboard('.copy-tiny-url');
});