/*
 * Jexl
 * Copyright (c) 2015 TechnologyAdvice
 */

var chai = require('chai'),
  should = require('chai').should(),
  sinon = require('sinon'),
  Jexl = require('../lib/Jexl'),
  Parser = require('../lib/parser/Parser');

var inst;

describe('Jexl', function() {
  beforeEach(function() {
    inst = new Jexl.Jexl();
  });
  it('should succeed', function() {
    inst.eval('2+2').should.equal(4);
  });
  it('should throw on error', function() {
    (function() {
      inst.eval('2++2');
    }).should.throw(Error);
  });
  it('should allow transforms to be defined', function() {
    inst.addTransform('toCase', function(val, args) {
      if (args.case === 'upper')
        return val.toUpperCase();
      return val.toLowerCase();
    });
    inst.eval('"hello"|toCase({case:"upper"})').should.equal('HELLO');
  });
  it('should allow transforms to be retrieved', function() {
    inst.addTransform('ret2', function() { return 2; });
    var t = inst.getTransform('ret2');
    should.exist(t);
    t().should.equal(2);
  });
  it('should allow transforms to be set in batch', function() {
    inst.addTransforms({
      add1: function(val) { return val + 1; },
      add2: function(val) { return val + 2; }
    });
    inst.eval('2|add1|add2').should.equal(5);
  });
  it('should pass context', function() {
    inst.eval('foo', {foo: 'bar'}).should.equal('bar');
  });
  it('should allow binaryOps to be defined', function() {
    inst.addBinaryOp('_=', 20, function(left, right) {
      return left.toLowerCase() === right.toLowerCase();
    });
    inst.eval('"FoO" _= "fOo"').should.equal(true);
  });
  it('should observe weight on binaryOps', function() {
    inst.addBinaryOp('**', 0, function(left, right) {
      return left * 2 + right * 2;
    });
    inst.addBinaryOp('***', 1000, function(left, right) {
      return left * 2 + right * 2;
    });
    inst.eval('1 + 2 ** 3 + 4').should.equal(20);
    inst.eval('1 + 2 *** 3 + 4').should.equal(15);
  });
  it('should allow unaryOps to be defined', function() {
    inst.addUnaryOp('~', function(right) {
      return Math.floor(right);
    });
    inst.eval('~5.7 + 5').should.equal(10);
  });
  it('should allow binaryOps to be removed', function() {
    inst.removeOp('+');
    (function() {
      inst.eval('1+2')
    }).should.throw(Error);
  });
  it('should allow unaryOps to be removed', function() {
    inst.removeOp('!');
    (function() {
      inst.eval('!true')
    }).should.throw(Error);
  });

  describe('parser cache', function() {
    var static_inst = new Jexl.Jexl();

    before(function() {
      sinon.spy(Parser.prototype, 'complete');
      sinon.spy(static_inst, '_clearParserCache');
    });
    beforeEach(function() {
      Parser.prototype.complete.reset();
      static_inst._clearParserCache.reset();
    });
    after(function() {
      Parser.prototype.complete.restore();
      static_inst._clearParserCache.restore();
    });

    it('should call parser.complete on the first run', function() {
      var res = static_inst.eval('8+8');
      res.should.equal(16);
      Parser.prototype.complete.callCount.should.equal(1);
    });

    it('should not call parser.complete on the second run', function() {
      var res = static_inst.eval('8+8');
      res.should.equal(16);
      Parser.prototype.complete.callCount.should.equal(0);
    });

    it('should clear the parser cache when adding a new op', function() {
      static_inst.addBinaryOp('**', 0, function(left, right) {
        return left * 2 + right * 2;
      });

      static_inst._clearParserCache.callCount.should.equal(1);
    });
  });
});
