{% extends 'layout.swig' %}

{% block pageTitle %}
  Symcoding on '{{ repo }}' :: SymCode
{% endblock %}

{% block content %}
  <header class="ui fixed inverted menu">
    <div class="ui container">
      <div class="header item"><a href="/">SymCode</a></div>
      <div class="header item">{{ repo }}</div>
      <div class="item">
        Active Symcode Session
        <button id="reset-button" class="ui small icon button" 
          title="Reset this Session to Step 1" onclick="symcodeApp.reset();">
          <i class="icon refresh"></i>
        </button>
        <button id="exit-button" class="ui small icon button"
          title="Exit and Discard this Session" onclick="symcodeApp.reset(true);">
          <i class="icon remove"></i>
        </button>
      </div>
    </div>
    <aside id="current-step" class="ui huge inverted header">
      Step <span>?</span>
      <button class="ui button" title="Skip to the next Step" onclick="symcodeApp.nextStep();">
        <i class="icon right arrow"></i>
      </button>
    </aside>
  </header>
  <div id="page-wrap" class="ui main container">
    <section id="overview" class="ui container">
      <h3 class="ui header">Overview</h3>
      <table id="overview-table" class="ui unstackable table">
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
      <div id="livediff-segments" class="ui inverted segments">
        <div id="livediff-loading" class="ui segment">
          <i class="wait icon"></i> Fetching Livediff...
        </div>
      </div>
    </section>
  </div>
{% endblock %}

{% block scripts %}
  <script src="/js/symcode.js"></script>
  <script>
    // Initialize the current repo info on the client
    var symcode = {
      repo: "{{ repo }}"
    };
  </script>
{% endblock %}
