import * as React from 'react';
import {
  Store,
  FormInstance,
  FieldData,
  ValidateMessages,
  Callbacks,
  InternalFormInstance,
} from './interface';
import useForm from './useForm';
import FieldContext, { HOOK_MARK } from './FieldContext';
import FormContext, { FormContextProps } from './FormContext';
import { isSimilar } from './utils/valueUtil';

type BaseFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>;

type RenderProps = (values: Store, form: FormInstance) => JSX.Element | React.ReactNode;

export interface FormProps extends BaseFormProps {
  initialValues?: Store;
  form?: FormInstance;
  children?: RenderProps | React.ReactNode;
  fields?: FieldData[];
  name?: string;
  validateMessages?: ValidateMessages;
  __COMPATIBILITY_USAGE_OR_YOU_WILL_BE_FIRED__?: {
    NOT_CONTAIN_FORM?: boolean;
    HOOK_MARK: string;
  };
  onValuesChange?: Callbacks['onValuesChange'];
  onFieldsChange?: Callbacks['onFieldsChange'];
  onFinish?: (values: Store) => void;
}

const Form: React.FunctionComponent<FormProps> = (
  {
    name,
    initialValues,
    fields,
    form,
    children,
    validateMessages,
    onValuesChange,
    onFieldsChange,
    onFinish,
    __COMPATIBILITY_USAGE_OR_YOU_WILL_BE_FIRED__,
    ...restProps
  }: FormProps,
  ref,
) => {
  const formContext: FormContextProps = React.useContext(FormContext);

  // We customize handle event since Context will makes all the consumer re-render:
  // https://reactjs.org/docs/context.html#contextprovider
  const [formInstance] = useForm(form);
  const {
    useSubscribe,
    setInitialValues,
    setCallbacks,
    setValidateMessages,
  } = (formInstance as InternalFormInstance).getInternalHooks(HOOK_MARK);

  // Pass ref with form instance
  React.useImperativeHandle(ref, () => formInstance);

  // Register form into Context
  React.useEffect(() => formContext.registerForm(name, formInstance), [
    formContext,
    formInstance,
    name,
  ]);

  // Pass props to store
  setValidateMessages({
    ...formContext.validateMessages,
    ...validateMessages,
  });
  setCallbacks({
    onValuesChange,
    onFieldsChange: (changedFields: FieldData[], ...rest) => {
      formContext.triggerFormChange(name, changedFields);

      if (onFieldsChange) {
        onFieldsChange(changedFields, ...rest);
      }
    },
  });

  // Set initial value, init store value when first mount
  const mountRef = React.useRef(null);
  setInitialValues(initialValues, !mountRef.current);
  if (!mountRef.current) {
    mountRef.current = true;
  }

  // Prepare children by `children` type
  let childrenNode = children;
  const childrenRenderProps = typeof children === 'function';
  if (childrenRenderProps) {
    const values = formInstance.getFieldsValue();
    childrenNode = (children as RenderProps)(values, formInstance);
  }

  // Not use subscribe when using render props
  useSubscribe(!childrenRenderProps);

  // Listen if fields provided. We use ref to save prev data here to avoid additional render
  const prevFieldsRef = React.useRef<FieldData[] | undefined>();
  React.useEffect(() => {
    if (!isSimilar(prevFieldsRef.current || [], fields || [])) {
      formInstance.setFields(fields || []);
    }
    prevFieldsRef.current = fields;
  }, [fields, formInstance]);

  if (
    __COMPATIBILITY_USAGE_OR_YOU_WILL_BE_FIRED__ &&
    __COMPATIBILITY_USAGE_OR_YOU_WILL_BE_FIRED__.NOT_CONTAIN_FORM &&
    __COMPATIBILITY_USAGE_OR_YOU_WILL_BE_FIRED__.HOOK_MARK ===
      'asdihasiodhaohdioahfoihsoefhisihifhsiofhiosfd'
  ) {
    return (
      <FieldContext.Provider value={formInstance as InternalFormInstance}>
        {childrenNode}
      </FieldContext.Provider>
    );
  }

  return (
    <form
      {...restProps}
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();

        formInstance
          .validateFields()
          .then(values => {
            if (onFinish) {
              onFinish(values);
            }
          })
          // Do nothing about submit catch
          .catch(e => e);
      }}
    >
      <FieldContext.Provider value={formInstance as InternalFormInstance}>
        {childrenNode}
      </FieldContext.Provider>
    </form>
  );
};

export default Form;
