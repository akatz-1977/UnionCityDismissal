UNION CITY DISMISSAL VOICE PACKAGE

This package makes the app speak only the exact number or words typed in the entry field.
It does not automatically say Car Rider, Walk Up, or To Office.

ADD THESE FILES TO YOUR APP:
- dismissal-voice.js
- dismissal-voice.css

In the page head:
<link rel="stylesheet" href="dismissal-voice.css">

Before the closing body tag:
<script src="dismissal-voice.js"></script>

In the code that runs when Call Number is tapped, add:
DismissalVoice.announce(number);

Voice defaults to OFF. The user can turn it on with the added button.
The Repeat Last button repeats the most recently called entry.
