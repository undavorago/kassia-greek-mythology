import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openCatalogTarget} from '../assets/js/catalog.js';

function fixture() {
  const main = {tagName:'MAIN', parentElement:null};
  const blocks = {tagName:'DETAILS', open:false, parentElement:main};
  const course = {tagName:'DETAILS', open:false, parentElement:blocks};
  const lesson = {tagName:'LI', parentElement:course};
  const other = {tagName:'DETAILS', open:false, parentElement:main};
  const outside = {tagName:'DETAILS', open:false, parentElement:null};
  const nodes = {blocks, foundations:course, lesson, other, outside};
  Object.values(nodes).forEach(node => {node.closest = () => node === outside ? null : main;});
  return {document:{getElementById:id=>nodes[id]??null}, ...nodes};
}

test('a deep link opens its course and its folded group, leaving other groups alone', () => {
  const f=fixture();
  assert.equal(openCatalogTarget(f.document,'#lesson'),f.lesson);
  assert.equal(f.foundations.open,true);
  assert.equal(f.blocks.open,true);
  assert.equal(f.other.open,false);
});

test('the group anchor does not expand every course', () => {
  const f=fixture();
  openCatalogTarget(f.document,'#blocks');
  assert.equal(f.blocks.open,true);
  assert.equal(f.foundations.open,false);
});

test('the same anchor reopens a course after a reader manually closes it', () => {
  const f=fixture();
  openCatalogTarget(f.document,'#foundations');
  f.foundations.open=false;f.blocks.open=false;
  openCatalogTarget(f.document,'#foundations');
  assert.equal(f.foundations.open,true);assert.equal(f.blocks.open,true);
});

test('empty, unknown, malformed and non-catalog anchors never change folds or throw', () => {
  const f=fixture();
  for(const hash of ['', '#', '#missing', '#outside', '#%E0%A4']) {
    assert.equal(openCatalogTarget(f.document,hash),null);
    assert.equal(f.blocks.open,false);assert.equal(f.foundations.open,false);
  }
  assert.equal(f.outside.open,false);
});
