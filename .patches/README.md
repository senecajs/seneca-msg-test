# Workflow patches

GitHub requires the `workflow` OAuth scope to add or change files under
`.github/workflows/`. The session that prepared this branch did not have
it, so the workflow change is provided here as a git patch instead.

Apply it from a checkout with normal credentials:

```sh
git am .patches/*.patch
git rm -r .patches
git commit -m "ci: remove applied workflow patch"
git push
```

| Patch | Changes |
| ----- | ------- |
| `0001-ci-build-on-Node-24-and-22.patch` | Replaces the matrix of `.github/workflows/build.yml` (Node.js lts/*, 17, 16, 14, 12 and 10 on three operating systems, with a Coveralls upload) with Node.js 24 and 22 on `ubuntu-latest`: `actions/checkout@v4`, `actions/setup-node@v4` with the npm cache, `npm install`, `npm run build --if-present`, `npm test`. The workflow runs on pushes and pull requests for `master` and `main`. The README build badge points at it. |

`git apply --check .patches/*.patch` verifies that the patch applies.
