/*
 * Jexl
 * Copyright (c) 2015 TechnologyAdvice
 */

var chai = require('chai'),
  should = require('chai').should(),
  expect = require('chai').expect,
  Lexer = require('../../lib/Lexer'),
  Parser = require('../../lib/parser/Parser'),
  Evaluator = require('../../lib/evaluator/Evaluator'),
  grammar = require('../../lib/grammar').elements;

var lexer = new Lexer(grammar);

function toTree(exp) {
  var p = new Parser(grammar);
  p.addTokens(lexer.tokenize(exp));
  return p.complete();
}

describe('Evaluator', function() {
  it('should evaluate an arithmetic expression', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('(2 + 3) * 4')).should.equal(20);
  });
  it('should evaluate a string concat', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('"Hello" + (4+4) + "Wo\\"rld"')).should.equal('Hello8Wo"rld');
  });
  it('should evaluate a true comparison expression', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('2 > 1')).should.equal(true);
  });
  it('should evaluate a false comparison expression', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('2 <= 1')).should.equal(false);
  });
  it('should evaluate a complex expression', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('"foo" && 6 >= 6 && 0 + 1 && true')).should.equal(true);
  });
  it('should evaluate an identifier chain', function() {
    var context = {foo: {baz: {bar: 'tek'}}},
      e = new Evaluator(grammar, null, context);
    e.eval(toTree('foo.baz.bar')).should.equal(context.foo.baz.bar);
  });
  it('should apply transforms', function() {
    var context = {foo: 10},
      half = function(val) {
        return val / 2;
      },
      e = new Evaluator(grammar, {half: half}, context);
    e.eval(toTree('foo|half + 3')).should.equal(8);
  });
  it('should filter arrays', function() {
    var context = {foo: {bar: [
        {tek: 'hello'},
        {tek: 'baz'},
        {tok: 'baz'}
      ]}},
      e = new Evaluator(grammar, null, context);
    e.eval(toTree('foo.bar[.tek == "baz"]')).should.deep.equal([{tek: 'baz'}]);
  });
  it('should assume array index 0 when traversing', function() {
    var context = {foo: {bar: [
        {tek: {hello: 'world'}},
        {tek: {hello: 'universe'}}
      ]}},
      e = new Evaluator(grammar, null, context);
    e.eval(toTree('foo.bar.tek.hello')).should.equal('world');
  });
  it('should make array elements addressable by index', function() {
    var context = {foo: {bar: [
        {tek: 'tok'},
        {tek: 'baz'},
        {tek: 'foz'}
      ]}},
      e = new Evaluator(grammar, null, context);
    e.eval(toTree('foo.bar[1].tek')).should.equal('baz');
  });
  it('should allow filters to select object properties', function() {
    var context = {foo: {baz: {bar: 'tek'}}},
      e = new Evaluator(grammar, null, context);
    e.eval(toTree('foo["ba" + "z"].bar')).should.equal(context.foo.baz.bar);
  });
  it('should throw when transform does not exist', function() {
    var e = new Evaluator(grammar);
    (function() {
      e.eval(toTree('"hello"|world'));
    }).should.throw(Error);
  });
  it('should apply the DivFloor operator', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('7 // 2')).should.equal(3);
  });
  it('should evaluate an object literal', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('{foo: {bar: "tek"}}')).should.deep.equal({foo: {bar: 'tek'}});
  });
  it('should evaluate an empty object literal', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('{}')).should.deep.equal({});
  });
  it('should evaluate a transform with multiple args', function() {
    var e = new Evaluator(grammar, {
      concat: function(val, a1, a2, a3) {
        return val + ": " + a1 + a2 + a3;
      }
    });
    e.eval(toTree('"foo"|concat("baz", "bar", "tek")')).should.equal('foo: bazbartek');
  });
  it('should evaluate dot notation for object literals', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('{foo: "bar"}.foo')).should.equal('bar');
  });
  it('should allow access to literal properties', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('"foo".length')).should.equal(3);
  });
  it('should evaluate array literals', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('["foo", 1+2]')).should.deep.equal(["foo", 3]);
  });
  it('should apply the "in" operator to strings', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('"bar" in "foobartek"')).should.equal(true);
    e.eval(toTree('"baz" in "foobartek"')).should.equal(false);

  });
  it('should apply the "in" operator to arrays', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('"bar" in ["foo","bar","tek"]')).should.equal(true);
    e.eval(toTree('"baz" in ["foo","bar","tek"]')).should.equal(false);
  });
  it('should evaluate a conditional expression', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('"foo" ? 1 : 2')).should.equal(1);
    e.eval(toTree('"" ? 1 : 2')).should.equal(2);
  });
  it('should allow missing consequent in ternary', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('"foo" ?: "bar"')).should.equal("foo");
  });
  it('does not treat falsey properties as undefined', function() {
    const e = new Evaluator(grammar);
    e.eval(toTree('"".length')).should.equal(0);
  });
  it('should handle an expression with arbitrary whitespace', function() {
    var e = new Evaluator(grammar);
    e.eval(toTree('(\t2\n+\n3) *\n4\n\r\n')).should.equal(20);
  });
});
