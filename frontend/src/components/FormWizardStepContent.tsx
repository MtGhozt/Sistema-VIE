import {ComplementosFormulario} from "./ComplementosFormulario";
import type {ReactNode} from 'react';
import type {Convocatoria} from '../api/convocatorias';
import type {FormWizardState} from '../data/formWizard';
import {toIan,applyIan} from '../data/formWizardAdapter';
import {FormWizardIan} from './FormWizardIan';
export function FormWizardStepContent(props:{bloquearIdentificacion?:boolean;documentos?:ReactNode;step:number;form:FormWizardState;patch:(p:Partial<FormWizardState>)=>void;convocatorias:Convocatoria[];idConvocatoria:number|'';setIdConvocatoria:(v:number|'')=>void}){
 if(props.step===16)return <div className="stack-md"><h3>Revisión antes del envío</h3><p>{props.form.titulo}</p><p>Modalidad: {props.form.modalidad}. Resumen: {props.form.resumen}</p><p>Objetivo general: {props.form.objetivos}</p><p>Equipo: {props.form.equipo.length} personas. Plan: {props.form.actividades.length} actividades.</p><p>Revise también los datos normalizados y documentos en «Ver expediente guardado». El servidor valida los requisitos al enviar.</p><ComplementosFormulario detalles={props.form.detallesFormulario}/></div>;
 return <FormWizardIan {...props} form={toIan(props.form)} patch={partial=>props.patch(applyIan(props.form,partial,props.step))} lineas={props.form.lineas} trlActual={props.form.trlActual} onIdentificacion={props.patch}/>;
}
