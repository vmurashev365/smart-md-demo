/**
 * Snippet Syntax for Cucumber
 *
 * Custom snippet syntax for generating step definition templates.
 * Uses 'any' types due to Cucumber's internal type definitions not being fully exported.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TypeScript async/await snippet syntax
 */
const snippetSyntax = {
  build({
    comment,
    generatedExpressions,
    functionName,
    stepParameterNames,
  }: {
    comment: string;
    generatedExpressions: any[];
    functionName: string;
    stepParameterNames: string[];
  }): string {
    const functionKeyword = functionName === 'Given' || functionName === 'When' || functionName === 'Then'
      ? functionName
      : 'Given';

    const expression = generatedExpressions[0];
    const expressionTemplate = expression.source;

    const parameterTypes = expression.parameterTypes.map((p: any, i: number) => {
      const name = stepParameterNames[i] || p.name || `arg${i}`;
      const type = getTypeScriptType(p.name);
      return `${name}: ${type}`;
    });

    const allParameters = [...parameterTypes];

    // Add DataTable if present
    if (stepParameterNames.includes('dataTable')) {
      allParameters.push('dataTable: DataTable');
    }

    // Add DocString if present
    if (stepParameterNames.includes('docString')) {
      allParameters.push('docString: string');
    }

    const parametersString = allParameters.join(', ');

    return `
${functionKeyword}('${expressionTemplate}', async function (${parametersString}) {
  // ${comment}
  throw new Error('Not implemented');
});
`.trim();
  },
};

/**
 * Get TypeScript type for Cucumber parameter type
 */
function getTypeScriptType(cucumberType: string): string {
  const typeMap: Record<string, string> = {
    int: 'number',
    float: 'number',
    word: 'string',
    string: 'string',
    '': 'string',
  };

  return typeMap[cucumberType] || 'string';
}

export default snippetSyntax;
