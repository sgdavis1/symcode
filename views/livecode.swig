{% extends 'layout.swig' %}

{% block content %}
  <header class="ui fixed inverted menu">
    <div class="ui container">
      <div class="header item"><a href="/">LiveCode</a></div>
      <div class="header item">{{ repo }}</div>
      <div class="item">Active Livecode Session</div>
    </div>
  </header>
  <div id="page-wrap" class="ui main container">
    <section id="overview" class="ui container">
      <h3 class="ui header">Overview</h3>
      <table id="overview-table" class="ui table">
        <thead>
          <tr>
            <th>Step</th>
            <th>Hash</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="3"><i class="wait icon"></i> Fetching instructions...</td>
        </tbody>
      </table>
      <aside id="current-step" class="ui huge inverted header">
        Step <span>?</span>
      </aside>
    </section>
    <section id="current-step-details" class="ui container">
      <h4 class="ui header">File changes in this step:</h4>
      <div class="ui inverted segment">
        <div id="current-step-accordion" class="ui inverted accordion">
          <div><i class="wait icon"></i> Fetching Step instructions...</div>
        </div>
      </div>
    </section>
    <section id="livediff" class="ui container">
      <h4 class="ui header">Livediff information:</h4>
      <div class="ui inverted segment">
        <div id="livediff-accordian" class="ui inverted accordion">
          <div><i class="wait icon"></i> Fetching Livediff...</div>
        </div>
      </div>
    </section>
  </div>
{% endblock %}

{% block scripts %}
  <script src="/js/livecode.js"></script>
  <script>
    // Initialize the current repo info on the client
    var livecode = {
      repo: "{{ repo }}"
    };
  </script>
{% endblock %}
