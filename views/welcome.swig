{% extends 'layout.swig' %}

{% block content %}
<header id="welcome" class="ui inverted vertical masthead center aligned segment">
  <div class="ui text container">
    <h1 class="ui inverted header">SymCode</h1>
    <h2>
      <p>Simple coding guidance framework, for real-time programming demonstrations</p>
      <div class="ui huge purple button">
        Get Started <i class="right arrow icon"></i>
      </div>
  </div>
</header>
<section id="welcome-details" class="ui vertical strip segment">
  <div class="ui center aligned container">
    <h3 class="ui header">Programming demonstrations &mdash; Without Mistakes!</h3>
    <p>Setup and replay every step of a programming demonstration, using your tools
    of choice, while our system guides each step based on a pre-compiled Git
    repository.</p>
    <div class="ui center aligned container">
      <h2 class="ui header purple">Want to know more?</h2>
      <p class="ui">Post your questions to the Github repo for this project</p>
    </div>
  </div>
</section>
{% endblock %}
