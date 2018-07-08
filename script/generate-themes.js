const _ = require('lodash');
const { join } = require('path');
const { writeFileSync } = require('fs');
const OUTPUT_DIR = '../src/less/themes';
const THEMES_CONFIG = require('../themes.config');
const CONTENT = `@import "../index";`
const HEADER = '// Generate by Script, Config file is themes.config.js';

const write = _.partial(writeFileSync, _, _, 'utf8');

const getModifyVariablesContent = (variableConfig) => {
  const declaredContent = _.map(_.entries(variableConfig), ([key, value]) => `@${key}:${value};`);
  return declaredContent.join('\r');
};

_.forEach(_.entries(THEMES_CONFIG), ([theme, config]) => {
  const fileName = `${theme}.less`;
  const modifyVariablesContent = getModifyVariablesContent(config);
  const content = `${CONTENT}

${HEADER}
${modifyVariablesContent}`;
  const outPutFilePath = join(__dirname, OUTPUT_DIR, fileName);
  let flag = true;
  try {
    write(outPutFilePath, content);
  } catch (e) {
    flag = false;
  }
  console.log(`Generate ${outPutFilePath} ${flag ? 'Succeed' : 'Failed'}.`);
});

const jsContent = _.map(_.keys(THEMES_CONFIG), theme => `import './less/themes/${theme}.less';`).join('\r');

write(join(__dirname, '../src/themes.js'), `${HEADER}
${jsContent}`);
