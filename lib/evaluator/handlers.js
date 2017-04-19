/*
 * Jexl
 * Copyright (c) 2015 TechnologyAdvice
 */

/**
 * Evaluates an ArrayLiteral by returning its value, with each element
 * independently run through the evaluator.
 * @param {{type: 'ObjectLiteral', value: <{}>}} ast An expression tree with an
 *      ObjectLiteral as the top node
 * @returns {[]} returns a map contained evaluated values.
 * @private
 */
exports.ArrayLiteral = function(ast) {
  return this.evalArray(ast.value);
};

/**
 * Evaluates a BinaryExpression node by running the Grammar's evaluator for
 * the given operator.
 * @param {{type: 'BinaryExpression', operator: <string>, left: {},
 *      right: {}}} ast An expression tree with a BinaryExpression as the top
 *      node
 * @returns {*} returns the value of the BinaryExpression.
 * @private
 */
exports.BinaryExpression = function(ast) {
  return this._grammar[ast.operator].eval(this.eval(ast.left), this.eval(ast.right));
};

/**
 * Evaluates a ConditionalExpression node by first evaluating its test branch,
 * and resolving with the consequent branch if the test is truthy, or the
 * alternate branch if it is not. If there is no consequent branch, the test
 * result will be used instead.
 * @param {{type: 'ConditionalExpression', test: {}, consequent: {},
 *      alternate: {}}} ast An expression tree with a ConditionalExpression as
 *      the top node
 * @private
 */
exports.ConditionalExpression = function(ast) {
  var res = this.eval(ast.test);
  if (res) {
    if (ast.consequent)
      return this.eval(ast.consequent);
    return res;
  }
  return this.eval(ast.alternate);
};

/**
 * Evaluates a FilterExpression by applying it to the subject value.
 * @param {{type: 'FilterExpression', relative: <boolean>, expr: {},
 *      subject: {}}} ast An expression tree with a FilterExpression as the top
 *      node
 * @returns {*} returns the value of the FilterExpression.
 * @private
 */
exports.FilterExpression = function(ast) {
  var subject = this.eval(ast.subject);
  if (ast.relative)
    return this._filterRelative(subject, ast.expr);
  return this._filterStatic(subject, ast.expr);
};

/**
 * Evaluates an Identifier by either stemming from the evaluated 'from'
 * expression tree or accessing the context provided when this Evaluator was
 * constructed.
 * @param {{type: 'Identifier', value: <string>, [from]: {}}} ast An expression
 *      tree with an Identifier as the top node
 * @returns {*} returns the identifier's value.
 * @private
 */
exports.Identifier = function(ast) {
  if (ast.from) {
    var context = this.eval(ast.from);
    if (context === undefined)
      return undefined;
    if (Array.isArray(context))
      context = context[0];
    return context[ast.value];
  }
  else {
    return ast.relative ? this._relContext[ast.value] :
      this._context[ast.value];
  }
};

/**
 * Evaluates a Literal by returning its value property.
 * @param {{type: 'Literal', value: <string|number|boolean>}} ast An expression
 *      tree with a Literal as its only node
 * @returns {string|number|boolean} The value of the Literal node
 * @private
 */
exports.Literal = function(ast) {
  return ast.value;
};

/**
 * Evaluates an ObjectLiteral by returning its value, with each key
 * independently run through the evaluator.
 * @param {{type: 'ObjectLiteral', value: <{}>}} ast An expression tree with an
 *      ObjectLiteral as the top node
 * @returns {{}} returns a map contained evaluated values.
 * @private
 */
exports.ObjectLiteral = function(ast) {
  return this.evalMap(ast.value);
};

/**
 * Evaluates a Transform node by applying a function from the transforms map
 * to the subject value.
 * @param {{type: 'Transform', name: <string>, subject: {}}} ast An
 *      expression tree with a Transform as the top node
 * @returns {*} returns the value of the transformation.
 * @private
 */
exports.Transform = function(ast) {
  var transform = this._transforms[ast.name];
  if (!transform)
    throw new Error("Transform '" + ast.name + "' is not defined.");

  var subject = this.eval(ast.subject);
  var args = this.evalArray(ast.args || []);

  return transform.apply(null, [subject].concat(args));
};

/**
 * Evaluates a Unary expression by passing the right side through the
 * operator's eval function.
 * @param {{type: 'UnaryExpression', operator: <string>, right: {}}} ast An
 *      expression tree with a UnaryExpression as the top node
 * @returns {*} returns the value of the UnaryExpression.
 * @constructor
 */
exports.UnaryExpression = function(ast) {
  return this._grammar[ast.operator].eval(this.eval(ast.right));
};
