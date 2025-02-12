import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import Form, { Field, List } from '../src';
import { Input } from './common/InfoField';
import { changeValue, getField } from './common';

describe('Form.List', () => {
  let form;

  function generateForm(renderList, formProps) {
    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
          {...formProps}
        >
          <List name="list">{renderList}</List>
        </Form>
      </div>,
    );

    return [wrapper, () => getField(wrapper).find('div')];
  }

  it('basic', async () => {
    const [, getList] = generateForm(
      fields => (
        <div>
          {fields.map(field => (
            <Field {...field}>
              <Input />
            </Field>
          ))}
        </div>
      ),
      {
        initialValues: {
          list: ['', '', ''],
        },
      },
    );

    function matchKey(index, key) {
      expect(
        getList()
          .find(Field)
          .at(index)
          .key(),
      ).toEqual(key);
    }

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    const listNode = getList();

    await changeValue(getField(listNode, 0), '111');
    await changeValue(getField(listNode, 1), '222');
    await changeValue(getField(listNode, 2), '333');

    expect(form.getFieldsValue()).toEqual({
      list: ['111', '222', '333'],
    });
  });

  it('operation', async () => {
    let operation;
    const [wrapper, getList] = generateForm((fields, opt) => {
      operation = opt;
      return (
        <div>
          {fields.map(field => (
            <Field {...field}>
              <Input />
            </Field>
          ))}
        </div>
      );
    });

    function matchKey(index, key) {
      expect(
        getList()
          .find(Field)
          .at(index)
          .key(),
      ).toEqual(key);
    }

    // Add
    act(() => {
      operation.add();
    });
    act(() => {
      operation.add();
    });
    act(() => {
      operation.add();
    });

    wrapper.update();
    expect(getList().find(Field).length).toEqual(3);

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Modify
    await changeValue(getField(getList(), 1), '222');
    expect(form.getFieldsValue()).toEqual({
      list: [undefined, '222', undefined],
    });
    expect(form.isFieldTouched(['list', 0])).toBeFalsy();
    expect(form.isFieldTouched(['list', 1])).toBeTruthy();
    expect(form.isFieldTouched(['list', 2])).toBeFalsy();

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Remove
    act(() => {
      operation.remove(1);
    });
    wrapper.update();
    expect(getList().find(Field).length).toEqual(2);
    expect(form.getFieldsValue()).toEqual({
      list: [undefined, undefined],
    });
    expect(form.isFieldTouched(['list', 0])).toBeFalsy();
    expect(form.isFieldTouched(['list', 2])).toBeFalsy();

    matchKey(0, '0');
    matchKey(1, '2');

    // Remove not exist: less
    act(() => {
      operation.remove(-1);
    });
    wrapper.update();

    matchKey(0, '0');
    matchKey(1, '2');

    // Remove not exist: more
    act(() => {
      operation.remove(99);
    });
    wrapper.update();

    matchKey(0, '0');
    matchKey(1, '2');
  });

  it('validate', async () => {
    const [, getList] = generateForm(
      fields => (
        <div>
          {fields.map(field => (
            <Field {...field} rules={[{ required: true }]}>
              <Input />
            </Field>
          ))}
        </div>
      ),
      {
        initialValues: { list: [''] },
      },
    );

    await changeValue(getField(getList()), '');

    expect(form.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);
  });

  it('warning if children is not function', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    generateForm(<div />);

    expect(errorSpy).toHaveBeenCalledWith('Warning: Form.List only accepts function as children.');

    errorSpy.mockRestore();
  });
});
