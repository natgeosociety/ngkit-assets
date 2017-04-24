#!/bin/bash

# Usage: convertuikitjs.sh /path/to/uikit/src/js/

input_dir="$1"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
output_dir="$DIR/src/js"

# UI -> NG
# uikit -> ngkit
# uk- -> ng-
# uk. -> ng.

function walk_tree {
  local directory="$1"
  local i
  for i in "$directory"/*; do
    if [ "$i" = . -o "$i" = .. ]; then
      continue
    elif [ -d "$i" ]; then
      walk_tree "$i"
    elif [[ "$i" =~ \.js$ ]]; then
      sed -i '' -e 's/UI/NG/g' -e 's/uikit/ngkit/g' -e 's/uk-/ng-/g' -e 's/uk./ng./g' "$i"
    fi
  done
}
mv src/js src/jsbak
cp -R "$input_dir" "$output_dir"
walk_tree "$output_dir"
rm -R src/jsbak