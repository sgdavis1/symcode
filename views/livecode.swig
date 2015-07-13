{% extends 'layout.swig' %}

{% block content %}
  <header>
    <h1>{{ repo }}</h1>
    <h2>Active <a hreh="/">Livecode</a> Session</h2>
  </header>
  <section id="overview">
    <p>Overview</p>
    <table id="overview-table">
    </table>
    <aside id="current-step">
    </aside>
  </section>
  <section id="current-step-details">
    <p>File changes in this step:</p>
    <div id="current-step-accordian">
    </div>
  </section>
  <section id="livediff">
    <p>Livediff information:</p>
    <div id="livediff-accordian">
    </div>
  </section>
{% endblock %}
