#!/usr/bin/env node

const fs = require('fs');
const babel = require('@babel/core');
const t = require('@babel/types');
const prettier = require('prettier');
const yargs = require('yargs');
const path = require('path');
const chalk = require('chalk');
const findUp = require('find-up');

const argv = yargs
  .option('filename', {
    alias: 'f',
    type: 'string',
    description: 'want to transform filename'
  })
  .option('prettirerc', {
    alias: 'p',
    type: 'string',
    description: 'prettirerc file path'
  }).argv;

if (!argv.filename) {
  console.log(chalk.red('error: use --filename or -f pass file path'));
  process.exit(1);
}

const filename = path.resolve(process.cwd(), argv.filename);

const prettirepath =
  argv.prettirerc ||
  findUp.sync(['.prettierrc', '.prettierrc.js', 'prettier.config.js'], {
    cwd: filename
  });

const get = (object, path) => {
  if (typeof path === 'string')
    path = path.split('.').filter(key => key.length);
  return path.reduce((dive, key) => dive && dive[key], object);
};

function CallExpression(path, state) {
  const callee = path.node.callee;
  if (get(callee, 'callee.name') !== 'getFieldDecorator') {
    return;
  }
  const args = callee.arguments;
  const fieldName = args[0];
  const options = args[1];
  const children = path.node.arguments[0];
  const formItemProps = state.formAttributes || [
    t.jsxAttribute(t.jsxIdentifier('noStyle'))
  ];
  formItemProps.push(
    t.jsxAttribute(
      t.jsxIdentifier('name'),
      t.isStringLiteral(fieldName)
        ? fieldName
        : t.jsxExpressionContainer(fieldName)
    )
  );
  if (Array.isArray(options && options.properties)) {
    options.properties.forEach(prop => {
      if (prop.key.name === 'initialValue' && state.wrapperFormAttr) {
        const attrIndex = state.wrapperFormAttr.findIndex(att => {
          if (att.name.name === 'initialValue') {
            return true;
          }
        });
        if (attrIndex !== -1) {
          state.wrapperFormAttr[attrIndex].value.expression.properties.push(
            t.objectProperty(fieldName, prop.value)
          );
        } else {
          state.wrapperFormAttr.push(
            t.jsxAttribute(
              t.jsxIdentifier('initialValue'),
              t.jsxExpressionContainer(
                t.objectExpression([t.objectProperty(fieldName, prop.value)])
              )
            )
          );
        }
        return;
      }
      let propValue = prop.value;
      if (t.isStringLiteral(propValue)) {
        propValue = prop.value;
      } else if (
        t.isLiteral(propValue) ||
        t.isExpression(propValue) ||
        t.isTemplateLiteral(propValue)
      ) {
        propValue = t.jsxExpressionContainer(propValue);
      }
      const p = t.jsxAttribute(t.jsxIdentifier(prop.key.name), propValue);
      formItemProps.push(p);
    });
  }
  const formOpen = t.jsxOpeningElement(
    t.jsxIdentifier('Form.Item'),
    formItemProps,
    false
  );
  const formClose = t.jsxClosingElement(t.jsxIdentifier('Form.Item'));
  const FormItem = t.jsxElement(formOpen, formClose, [children], false);
  path.replaceWith(FormItem);
  path.stop();
}

function JSXExpressionContainer(path, state) {
  if (
    get(path, 'node.expression.callee') &&
    get(path, 'node.expression.callee.callee.name') === 'getFieldDecorator'
  ) {
    path.traverse({ CallExpression }, state);
    path.replaceWith(path.node.expression);
  }
}

function FormJSXElement(path, state) {
  path.traverse({ JSXElement, CallExpression, JSXExpressionContainer }, state);
}

function JSXElement(path, state) {
  const openingElement = get(path, 'node.openingElement');
  const jsxMemberExp = get(openingElement, 'name');
  if (
    get(jsxMemberExp, 'object.name') === 'Form' &&
    get(jsxMemberExp, 'property.name') === 'Item'
  ) {
    path.traverse(
      { JSXExpressionContainer },
      { ...state, formAttributes: openingElement.attributes }
    );
    path.replaceWithMultiple(path.node.children);
  } else if (get(jsxMemberExp, 'name') === 'Form') {
    FormJSXElement(path, {
      ...state,
      wrapperFormAttr: path.node.openingElement.attributes
    });
  }
}

const output = babel.transformFileSync(filename, {
  babelrc: false,
  plugins: [
    '@babel/plugin-syntax-class-properties',
    '@babel/plugin-syntax-jsx',
    function myCustomPlugin() {
      return {
        visitor: {
          JSXExpressionContainer,
          CallExpression,
          JSXElement
        }
      };
    }
  ]
});

if (prettirepath) {
  const prettierrc = fs.readFileSync(prettirepath, 'utf8');
  prettier.resolveConfig(prettierrc).then(options => {
    fs.writeFile(filename, prettier.format(output.code, options), err => {
      if (err) {
        chalk.red('migration fail');
        console.log(err);
      } else {
        chalk.green('migration successful');
      }
    });
  });
} else {
  fs.writeFile(filename, prettier.format(output.code), err => {
    if (err) {
      chalk.red('migration fail');
      console.log(err);
    } else {
      chalk.green('migration successful');
    }
  });
}
