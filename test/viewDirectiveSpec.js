/*jshint browser: true, indent: 2 */
/*global describe: false, it: false, beforeEach: false, expect: false, resolvedValue: false, module: false, inject: false, angular: false */

describe('uiView', function () {
  'use strict';

  var scope, $compile, elem;

  beforeEach(function() {
    var depends = ['ui.router'];

    try {
      angular.module('ngAnimate');
      depends.push('ngAnimate');
    } catch(e) {
      angular.module('mock.animate', []).value('$animate', null);
    }

    angular.module('ui.router.test', depends);
    module('ui.router.test');
    module('mock.animate');
  });

  beforeEach(module(function ($provide) {
    $provide.decorator('$uiViewScroll', function ($delegate) {
      return jasmine.createSpy('$uiViewScroll');
    });
  }));

  var aState = {
    template: 'aState template'
  },
  bState = {
    template: 'bState template'
  },
  cState = {
    views: {
      'cview': {
        template: 'cState cview template'
      }
    }
  },
  dState = {
    views: {
      'dview1': {
        template: 'dState dview1 template'
      },
      'dview2': {
        template: 'dState dview2 template'
      }
    }
  },
  eState = {
    template: '<div ui-view="eview" class="eview"></div>'
  },
  fState = {
    views: {
      'eview': {
        template: 'fState eview template'
      }
    }
  },
  gState = {
    template: '<div ui-view="inner"><span ng-class="{ test: true }">{{content}}</span></div>'
  },
  hState = {
    views: {
      'inner': {
        template: 'hState inner template'
      }
    }
  },
  iState = {
    template: '<div ui-view>'+
        '<ul><li ng-repeat="item in items">{{item}}</li></ul>'+
      '</div>'
  },
  jState = {
    template: '<span ng-class="test">jState</span>'
  },
  kState = {
    controller: function() {
      this.someProperty = "value"
    },
    controllerAs: "vm"
  };

  beforeEach(module(function ($stateProvider) {
    $stateProvider
      .state('a', aState)
      .state('b', bState)
      .state('c', cState)
      .state('d', dState)
      .state('e', eState)
      .state('e.f', fState)
      .state('g', gState)
      .state('g.h', hState)
      .state('i', iState)
      .state('j', jState)
      .state('k', kState)
  }));

  beforeEach(inject(function ($rootScope, _$compile_) {
    scope = $rootScope.$new();
    $compile = _$compile_;
    elem = angular.element('<div>');
  }));

  describe('linking ui-directive', function () {

    it('anonymous ui-view should be replaced with the template of the current $state', inject(function ($state, $q, $animate) {
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));
      if ($animate) $animate.flushNext('enter');

      $state.transitionTo(aState);

      $q.flush();

      if ($animate) {
        expect(elem.find('ui-view').text()).toBe('');
        expect($animate.flushNext('enter').element.text()).toBe(aState.template);
      }
    }));

    it('named ui-view should be replaced with the template of the current $state', inject(function ($state, $q, $animate) {
      elem.append($compile('<div><ui-view name="cview"></ui-view></div>')(scope));
      if ($animate) $animate.flushNext('enter');

      $state.transitionTo(cState);
      $q.flush();

      if ($animate) {
        expect(elem.find('ui-view[name="cview"]').text()).toBe('');
        expect($animate.flushNext('enter').element.text()).toBe(cState.views.cview.template);
      }
    }));

    it('ui-view should be updated after transition to another state', inject(function ($state, $q, $animate) {
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));
      if ($animate) $animate.flushNext('enter');

      $state.transitionTo(aState);
      $q.flush();

      if ($animate) {
        expect(elem.find('ui-view').text()).toBe('');
        expect($animate.flushNext('enter').element.text()).toBe(aState.template);
        $animate.flushNext('leave');
      }

      $state.transitionTo(bState);
      $q.flush();

      if ($animate) {
        expect($animate.flushNext('enter').element.text()).toBe(bState.template);
      }
    }));

    it('should handle NOT nested ui-views', inject(function ($state, $q, $animate) {
      elem.append($compile('<div><div ui-view="dview1" class="dview1"></div><div ui-view="dview2" class="dview2"></div></div>')(scope));
      if ($animate) {
        $animate.flushNext('enter');
        $animate.flushNext('enter');
      }

      $state.transitionTo(dState);
      $q.flush();

      if ($animate) {
        expect(elem.find('ui-view[name="dview1"]').text()).toBe('');
        expect($animate.flushNext('enter').element.text()).toBe(dState.views.dview1.template);
        $animate.flushNext('leave');
        expect(elem.find('ui-view[name="dview2"]').text()).toBe('');
        expect($animate.flushNext('enter').element.text()).toBe(dState.views.dview2.template);
      }
    }));

    it('should handle nested ui-views (testing two levels deep)', inject(function ($state, $q, $animate) {
      $compile(elem.append('<div ui-view class="view"></div>'))(scope);
      if ($animate) $animate.flushNext('enter');
      $state.transitionTo(fState);
      $q.flush();

      if ($animate) {
        expect(elem.find('ui-view').text()).toBe('');
        expect($animate.flushNext('enter').element.parent().find('.view')).toMatchText('');
        $animate.flushNext('leave');
        var target = $animate.flushNext('enter').element;
        expect(target).toHaveClass('eview');
        expect(target).toMatchText(fState.views.eview.template);
      }
    }));
  });

  describe('handling initial view', function () {
    it('initial view should be compiled if the view is empty', inject(function ($state, $q, $animate) {
      var content = 'inner content';
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));
      if ($animate) $animate.flushNext('enter');

      scope.$apply('content = "' + content + '"');

      $state.transitionTo(gState);
      $q.flush();

      if ($animate) {
        var target = elem.find('ui-view');
        expect(target.text()).toBe("");

        $animate.flushNext('enter');
        $animate.flushNext('leave');
        $animate.flushNext('enter');
        target = $animate.flushNext('addClass').element;
        expect(target).toHaveClass('test');
        expect(target.text()).toBe(content);
      }
    }));

    it('initial view should be put back after removal of the view', inject(function ($state, $q, $animate) {
      var content = 'inner content';

      elem.append($compile('<div><ui-view></ui-view></div>')(scope));
      if ($animate) $animate.flushNext('enter');

      scope.$apply('content = "' + content + '"');

      $state.transitionTo(hState);
      $q.flush();

      if ($animate) {
        $animate.flushNext('enter');
        $animate.flushNext('leave');
        expect($animate.flushNext('enter').element.text()).toBe(hState.views.inner.template);
        expect($animate.flushNext('addClass').element.text()).toBe(content);

        // going to the parent state which makes the inner view empty
        $state.transitionTo(gState);
        $q.flush();

        $animate.flushNext('enter');
        expect($animate.flushNext('leave').element).toMatchText(hState.views.inner.template);

        var target = $animate.flushNext('addClass').element;
        expect(target).toHaveClass('test');
        expect(target).toMatchText(content);
      }
    }));

    // related to issue #435
    it('initial view should be transcluded once to prevent breaking other directives', inject(function ($state, $q, $animate) {
      scope.items = ["I", "am", "a", "list", "of", "items"];

      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      // transition to state that has an initial view
      $state.transitionTo(iState);
      $q.flush();
      if ($animate) $animate.flush();

      // verify if ng-repeat has been compiled
      expect(elem.find('li').length).toBe(scope.items.length);

      // transition to another state that replace the initial content
      $state.transitionTo(jState);
      $q.flush();
      if ($animate) $animate.flush();

      expect(elem.find('ui-view').find('span').text()).toBe('jState');

      // transition back to the state with empty subview and the initial view
      $state.transitionTo(iState);
      $q.flush();
      if ($animate) $animate.flush();

      // verify if the initial view is correct
      expect(elem.find('li').length).toBe(scope.items.length);

      // change scope properties
      scope.$apply(function () {
        scope.items.push(".", "Working?");
      });

      if ($animate) $animate.flush();

      // verify if the initial view has been updated
      expect(elem.find('li').length).toBe(scope.items.length);
    }));

    // related to issue #857
    it('should handle ui-view inside ng-if', inject(function ($state, $q, $compile, $animate) {
      // ngIf does not exist in 1.0.8
      if (angular.version.full === '1.0.8') return;

      scope.someBoolean = false;
      elem.append($compile('<div ng-if="someBoolean"><ui-view></ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      // Verify there is no ui-view in the DOM
      expect(elem.find('ui-view').length).toBe(0);

      // Turn on the div that holds the ui-view
      scope.someBoolean = true;
      scope.$digest();

      if ($animate) $animate.flush();
      // Verify that the ui-view is there and it has the correct content
      expect(elem.find('ui-view').text()).toBe(aState.template);

      scope.someBoolean = false;
      scope.$digest();

      if ($animate) {
        $animate.flush();
        scope.$digest();
      }

      // Verify there is no ui-view in the DOM
      expect(elem.find('ui-view').length).toBe(0);

      // Turn on the div that holds the ui-view once again
      scope.someBoolean = true;
      scope.$digest();

      if ($animate) $animate.flush();
      // Verify that the ui-view is there and it has the correct content
      expect(elem.find('ui-view').text()).toBe(aState.template);
    }));
  });

  describe('autoscroll attribute', function () {
    it('should autoscroll when unspecified', inject(function ($state, $q, $uiViewScroll, $animate) {
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));
      $state.transitionTo(aState);
      $q.flush();
      if ($animate) $animate.flush();
      expect($uiViewScroll).toHaveBeenCalledWith(elem.find('span').parent());
    }));

    it('should autoscroll when expression is missing', inject(function ($state, $q, $uiViewScroll, $animate) {
      elem.append($compile('<div><ui-view autoscroll></ui-view></div>')(scope));
      $state.transitionTo(aState);
      $q.flush();
      if ($animate) $animate.flush();
      expect($uiViewScroll).toHaveBeenCalledWith(elem.find('span').parent());
    }));

    it('should autoscroll based on expression', inject(function ($state, $q, $uiViewScroll, $animate) {
      elem.append($compile('<div><ui-view autoscroll="doScroll"></ui-view></div>')(scope));

      scope.doScroll = false;
      $state.transitionTo(aState);
      $q.flush();
      expect($uiViewScroll).not.toHaveBeenCalled();

      scope.doScroll = true;
      $state.transitionTo(bState);
      $q.flush();
      if ($animate) $animate.flush();

      var target;
      angular.forEach(elem.find('ui-view'), function(view) {
        if (angular.element(view).text() === bState.template) target = angular.element(view);
      });

      expect($uiViewScroll).toHaveBeenCalledWith(target);
    }));

    it('should instantiate a controller with controllerAs', inject(function($state, $q) {
      elem.append($compile('<div><ui-view>{{vm.someProperty}}</ui-view></div>')(scope));
      $state.transitionTo(kState);
      $q.flush();
      var innerScope = scope.$$childHead;
      expect(innerScope.vm).not.toBeUndefined();
      expect(innerScope.vm.someProperty).toBe("value");
    }))
  });

});
