<!DOCTYPE html>
<html>
<head>
  <title>{% block pageTitle %}Welcome to SymCode!!{% endblock %}</title>
  <link rel="stylesheet" href="/semantic.min.css">
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/css/symcode.css">
</head>
<body>
  {% block content %}{% endblock %}
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
  <script src="/semantic.min.js"></script>
  {% block scripts %}{% endblock %}
</body>
</html>
