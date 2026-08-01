import { readFileSync } from 'fs';
import { join } from 'path';

describe('deploy.sh', () => {
  it('uses kubectl wildcard image update for the target deployment', () => {
    const script = readFileSync(join(__dirname, '../../deploy/deploy.sh'), 'utf8');

    expect(script).toContain('"*=$IMAGE_VERSION"');
    expect(script).not.toContain('"$DEPLOY_KEY"="$IMAGE_VERSION"');
  });
});
