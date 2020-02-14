// Grab the articles as a json
// $.getJSON("/articles", function(data) {

  $(document).on("click", "#scrape", function() {
    console.log('click')
    // // Empty the notes from the note section
    
    $.ajax({
        method: "GET",
        url: "/scrape",
}).done(function(data) {
    console.log(data)
    window.location = "/"
})
})
  //  // With that done, add the note information to the page
  //  .then(function(data) {
  //   console.log(data);
  //   // The title of the article
  //   $("#notes").append("<h2>" + data.title + "</h2>");
  //   // An input to enter a new title
  //   $("#notes").append("<input id='titleinput' name='title' >");
  //   // A textarea to add a new note body
  //   $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
  //   // A button to submit a new note, with the id of the article saved to it
  //   $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

 





//$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
//   var thisId = $(this).attr("data-id");
//instead : 

//Handle Save Article button
$(".save").on("click", function() {
var thisId = $(this).attr("data-id");
$.ajax({
    method: "POST",
    url: "/articles/save/" + thisId
}).done(function(data) {
    window.location = "/"
})
});


//Handle Delete Article button
$(".delete").on("click", function() {
var thisId = $(this).attr("data-id");
$.ajax({
    method: "POST",
    url: "/articles/delete/" + thisId
}).done(function(data) {
    window.location = "/saved"
})
});
// // $.ajax({
//     method: "POST",
//     url: "/articles/" + thisId,
//     data: {
//       // Value taken from title input
//       title: $("#titleinput").val(),
//       // Value taken from note textarea
//       body: $("#bodyinput").val()
//     }
//   })

//Handle Save Note button
$(".saveNote").on("click", function() {
var thisId = $(this).attr("data-id");
if (!$("#noteText" + thisId).val()) {
    alert("please enter a note to save")
}else {
  $.ajax({
        method: "POST",
        url: "/notes/save/" + thisId,
        data: {
          text: $("#noteText" + thisId).val()
        }
      }).done(function(data) {
          // Log the response
          console.log(data);
          // Empty the notes section
          $("#noteText" + thisId).val("");
          $(".modalNote").modal("hide");
          window.location = "/saved"
      });
}
});

//Handle Delete Note button
$(".deleteNote").on("click", function() {
var noteId = $(this).attr("data-note-id");
var articleId = $(this).attr("data-article-id");
$.ajax({
    method: "DELETE",
    url: "/notes/delete/" + noteId + "/" + articleId
}).done(function(data) {
    console.log(data)
    $(".modalNote").modal("hide");
    window.location = "/saved"
})
})
