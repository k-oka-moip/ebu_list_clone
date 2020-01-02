import React from 'react';
import AudioRtpInfo from './AudioRtpInfo';
import TsdfInfo from './TsdfInfo';
import AnalysisInfo from '../streamPage/AnalysisInfo';

const Analysis = props => {
    const streamInfo = props.streamInfo;
    const statistics = streamInfo.statistics;

    return (
        <div>
            <div className="row lst-full-height">
                <div className="col-xs-12 col-md-6">
                    <AudioRtpInfo {...props} />
                </div>
                <div className="col-xs-12 col-md-6">
                    <TsdfInfo {...props} />
                </div>
            </div>
            <div className="row lst-full-height">
                <div className="col-xs-12 col-md-6">
                    <AnalysisInfo {...props} />
                </div>
            </div>
        </div>
    );
};

export default Analysis;
