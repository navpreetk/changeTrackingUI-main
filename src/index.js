import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { TextInput,Table ,TableHead,TableRow,TableBody,TableCell,Button} from '@contentful/forma-36-react-components';
import { boolean, text, number, button } from '@storybook/addon-knobs'
import { init } from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

//const isJson=str=>{try {JSON.parse(str);} catch (e) {return false;}return true;};

export const App = ({sdk}) => {
  const [value, setValue] = useState(sdk.field.getValue() || '');
  const [hotelCode,setHotelCode]=useState(sdk.entry.fields['hotelCode'].getValue());
  const [changeTrackingRecords, setChangeTrackingRecords]=useState([]);
  const [filteredRecords,setFilteredRecords] = useState(changeTrackingRecords);

  const onExternalChange = value => {
    setValue(value);
  }

  const onChange = e => {
    const value = e.currentTarget.value;
    setValue(value);
    if (value) {
      sdk.field.setValue(value);
    } else {
      sdk.field.removeValue();
    }
  }

  useEffect(() => {
    sdk.window.startAutoResizer();

    if (hotelCode){
      sdk.space.getEntries({
        content_type:"hotelChangeTracking",
        'fields.hotelCode': hotelCode
      })
      .then(res=>{
        const recs=[];
          res.items.map((itm)=>{
            if(itm.fields !==undefined && itm.fields !==null && itm.fields.changeDetail !==undefined && itm.fields.changeDetail !==null 
              && itm.fields.changeDetail['en-CA'] !==undefined && itm.fields.changeDetail['en-CA'] !==null){ 
              return itm.fields.changeDetail['en-CA'].map(cd=>{
                let newVal;
                let oldVal;
                if(cd.newvalue !==undefined && cd.newvalue['en-CA'] !==undefined){
                  newVal=cd.newvalue['en-CA'];
                } else if(cd.newvalue !==undefined && cd.newvalue['fr-CA']!==undefined){
                  newVal=cd.newvalue['fr-CA'];
                } else {
                  newVal=cd.newvalue;
                }
                if(Array.isArray(newVal)){
                  newVal=JSON.stringify(newVal);
                }
                if(newVal.sys){
                  newVal=newVal.sys.id
                }
                if(cd.oldvalue !==undefined && cd.oldvalue['en-CA'] !==undefined){
                  oldVal=cd.oldvalue['en-CA'];
                } else if(cd.oldvalue !==undefined && cd.oldvalue['fr-CA']!==undefined){
                  oldVal=cd.oldvalue['fr-CA'];
                } else {
                  oldVal=cd.oldvalue;
                }
                if(Array.isArray(oldVal)){
                  oldVal=JSON.stringify(oldVal);
                }
                if(oldVal.sys){
                  oldVal=oldVal.sys.id
                }
                return recs.push({
                  fieldName:cd.fieldname,
                  newValue:newVal,
                  oldValue: oldVal,
                  timeModified: cd.changetime
                })
              })
            }    
        })
        setChangeTrackingRecords(recs);
        return recs;
      })
    }
  }, []);

  useEffect(() => {
    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    const detatchValueChangeHandler = sdk.field.onValueChanged(onExternalChange);
    return detatchValueChangeHandler;
  });
  useEffect(()=>{console.log(changeTrackingRecords)
    setFilteredRecords(changeTrackingRecords);
  },[changeTrackingRecords]);

  const searchChange=()=>{
    if(value){
      const filterResult=[];
      changeTrackingRecords.map(cr=>{
        if(cr.newValue.toString().includes(value) || cr.oldValue.toString().includes(value)){
          return filterResult.push(cr);
        }
      })
      setFilteredRecords(filterResult);
    }
    else{
      setFilteredRecords(changeTrackingRecords)
    }
  }

  return (
    <>
    <TextInput
      width="full"
      type="text"
      id="my-field"
      testId="my-field"
      value={value || ''}
      onChange={onChange}
    /><Button buttonType="muted" style={{float:'right'}} onClick={searchChange}>Search</Button>
    <MyTable changeRecords={filteredRecords}/>
    </>
  );
}

App.propTypes = {
  sdk: PropTypes.object.isRequired
};

init(sdk => {
  ReactDOM.render(<App sdk={sdk} />, document.getElementById('root'));
});


const MyTable=(props)=> {
  const {changeRecords}=props
  if(changeRecords===undefined || !Array.isArray(changeRecords) || changeRecords.length===0){
    return <><h5>No change record found</h5></>
  }
  return (
    <div style={{ width: '700px',height: '500px' }}>
      <Table>
        <TableHead
          isSticky={boolean('isSticky', false)}
          offsetTop={text('offsetTop', '0px')}
        >
          <TableRow>
            <TableCell>Field Name</TableCell>
            <TableCell>New Value</TableCell>
            <TableCell>Old Value</TableCell>
            <TableCell>Time Modified</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            changeRecords.map((cr,idx)=>{
              return<TableRow key={idx}>
                  <TableCell key={1}>{cr.fieldName}</TableCell>
                  <TableCell key={2}>{cr.newValue}</TableCell>
                  <TableCell key={3}>{cr.oldValue}</TableCell>
                  <TableCell key={4}>{cr.timeModified}</TableCell>
                </TableRow>
            })
          }
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
