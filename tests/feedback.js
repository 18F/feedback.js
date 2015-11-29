'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

var Feedback = require('../src/feedback');

describe('feedback', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().html(
      '<div id="feedback">' +
        '<button class="js-feedback feedback__toggle button--navy" aria-controls="feedback" aria-expanded="false" type="button">Feedback</button>' +
        '<div id="feedback" class="js-feedback-box feedback" aria-hidden="true">' +
          '<button class="js-feedback button--down feedback__close"><span class="u-visually-hidden">Close</span></button>' +
          '<div class="js-status message message--primary" aria-hidden="true">' +
            '<div class="js-status-content"></div>' +
            '<button class="js-reset button--primary feedback__button" type="button">Submit another issue</button>' +
          '</div>' +
          '<form id="feedback-form" class="container">' +
            '<fieldset>' +
              '<legend class="feedback__title">Help us improve betaFEC</legend>' +
              '<p class="t-sans">Don\'t include sensitive information like your name, contact information or Social Security number.</p>' +
              '<label for="feedback-1" class="label">What were you trying to do and how can we improve it?</label>' +
              '<textarea id="feedback-1" name="action"></textarea>' +
              '<label for="feedback-2" class="label">General feedback?</label>' +
              '<textarea id="feedback-2" name="feedback"></textarea>' +
              '<label for="feedback-3" class="label">Tell us about yourself</label>' +
              '<span class="label--help">I\'m a <span class="u-blank-space"></span> interested in <span class="u-blank-space"></span>.</span>' +
              '<textarea id="feedback-3" name="about"></textarea>' +
              '<p class="t-sans">This information will be reported on GitHub where it will be publicly visible. You can review all reported feedback on <a href="https://github.com/18f/fec/issues">our GitHub page</a>.</p>' +
              '<button type="submit" class="button--primary feedback__button">Submit</button>' +
            '</fieldset>' +
          '</form>' +
        '</div>' +
      '</div>'
    );
    this.feedback = new Feedback('http://localhost:3000/issue/', '#feedback');
  });

  describe('constructor', function() {
    it('memorizes its url', function() {
      expect(this.feedback.url).to.equal('http://localhost:3000/issue/');
    });
  });

  describe('toggle', function() {
    it('starts closed', function() {
      expect(this.feedback.isOpen).to.be.false;
    });

    it('opens on toggle', function() {
      this.feedback.toggle();
      expect(this.feedback.$box.attr('aria-hidden')).to.equal('false');
      expect(this.feedback.$button.attr('aria-expanded')).to.equal('true');
      expect(this.feedback.isOpen).to.be.true;
    });

    it('closes on second toggle', function() {
      this.feedback.toggle();
      this.feedback.toggle();
      expect(this.feedback.$box.attr('aria-hidden')).to.equal('true');
      expect(this.feedback.$button.attr('aria-expanded')).to.equal('false');
      expect(this.feedback.isOpen).to.be.false;
    });
  });

  describe('callbacks', function() {
    beforeEach(function() {
      this.message = sinon.spy(this.feedback, 'message');
    });

    afterEach(function() {
      this.message.restore();
    });

    it('clears text on success', function() {
      this.feedback.handleSuccess({html_url: 'https://github.com/18F/FEC/issue/1'});
      expect(this.feedback.$box.find('textarea').val()).to.equal('');
      expect(this.feedback.message).to.have.been.called;
    });

    it('shows message on error', function() {
      this.feedback.handleError(this.event);
      expect(this.feedback.message).to.have.been.called;
    });
  });

  describe('messages', function() {
    it('shows a message with expected class', function() {
      this.feedback.message('foo', 'bar', 'success');
      expect(this.feedback.$status.hasClass('message--success')).to.be.true;
    });

    it('hides previous classes', function() {
      this.feedback.message('foo', 'bar', 'success');
      this.feedback.message('foo', 'bar', 'error');
      expect(this.feedback.$status.hasClass('message--success')).to.be.false;
      expect(this.feedback.$status.hasClass('message--error')).to.be.true;
    });
  });

  describe('submission', function() {
    beforeEach(function() {
      this.ajaxStub = sinon.stub($, 'ajax');
      sinon.stub(this.feedback, 'handleSuccess');
      sinon.stub(this.feedback, 'handleError');
      this.event = {preventDefault: sinon.spy()};
      this.feedback.$box.find('textarea').val('awesome site good job');
    });

    afterEach(function() {
      $.ajax.restore();
      this.feedback.handleSuccess.restore();
      this.feedback.handleError.restore();
    });

    it('skips submit on empty inputs', function() {
      var message = sinon.spy(this.feedback, 'message');
      this.feedback.$box.find('textarea').val('');
      this.feedback.submit(this.event);
      expect(message).to.have.been.called;
      expect(this.ajaxStub).to.have.not.been.called;
    });

    it('calls handleSuccess on success', function() {
      var deferred = $.Deferred().resolve({});
      this.ajaxStub.returns(deferred);
      this.feedback.submit(this.event);
      expect(this.feedback.handleSuccess).to.have.been.called;
      expect(this.feedback.handleError).to.have.not.been.called;
    });

    it('calls handleError on error', function() {
      var deferred = $.Deferred().reject();
      this.ajaxStub.returns(deferred);
      this.feedback.submit(this.event);
      expect(this.feedback.handleSuccess).to.have.not.been.called;
      expect(this.feedback.handleError).to.have.been.called;
    });
  });
});
