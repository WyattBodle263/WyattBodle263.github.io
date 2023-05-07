<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $name = $_POST["name"];
  $email = $_POST["email"];
  $message = $_POST["message"];

  $to = "wyattbodle2025@outlook.com";
  $subject = "New Contact Form Submission";
  $body = "Name: $name\nEmail: $email\nMessage: $message";

  if (mail($to, $subject, $body)) {
    echo "<p>Your message was sent successfully. Thank you for contacting us!</p>";
  } else {
    echo "<p>There was a problem sending your message. Please try again.</p>";
  }
}
?>
