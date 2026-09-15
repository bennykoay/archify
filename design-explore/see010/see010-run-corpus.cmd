@echo off
setlocal
set OUT=tools\archify\design-explore\see010
call :run aben-kkse-agent-flow tools\archify\design-explore\aben-kkse-agent-flow.html
call :run chart1-boot-architecture-apple-hig tools\archify\design-explore\chart1-boot-architecture-apple-hig.html
call :run chart1-boot-architecture tools\archify\design-explore\chart1-boot-architecture.html
call :run chart1-boot-workflow tools\archify\design-explore\chart1-boot-workflow.html
call :run chart2-orom-architecture-apple-hig tools\archify\design-explore\chart2-orom-architecture-apple-hig.html
call :run chart2-orom-architecture tools\archify\design-explore\chart2-orom-architecture.html
call :run cnc-bus-architecture tools\archify\design-explore\cnc-bus-architecture.html
call :run einvoice-order-flow-v3 tools\archify\design-explore\einvoice-order-flow-v3.html
call :run einvoice-order-flow tools\archify\design-explore\einvoice-order-flow.html
call :run ref-chart-1 tools\archify\design-explore\ref-chart-1.html
call :run ref-chart-2 tools\archify\design-explore\ref-chart-2.html
call :run see007-see007-einvoice tools\archify\design-explore\see007\see007-einvoice.html
call :run see008-see008-einvoice tools\archify\design-explore\see008\see008-einvoice.html
call :run sys002-spike-r01 tools\archify\design-explore\sys002-spike\sys002-spike_b9268876_r01.html
call :run sys002-spike-r02 tools\archify\design-explore\sys002-spike\sys002-spike_b9268876_r02.html
call :run sys003-einvoice-r01 tools\archify\design-explore\sys003-einvoice-r01.html
call :run sys003-einvoice-r02 tools\archify\design-explore\sys003-einvoice-r02.html
call :run sys003-einvoice-r03 tools\archify\design-explore\sys003-einvoice-r03.html
call :run sys003-einvoice-r04 tools\archify\design-explore\sys003-einvoice-r04.html
call :run sys004-einvoice tools\archify\design-explore\sys004-einvoice.html
call :run sys004-org tools\archify\design-explore\sys004-org.html
call :run watchdog-local-cloud-flow-v2 tools\archify\design-explore\watchdog-local-cloud-flow-v2.html
call :run watchdog-local-cloud-flow tools\archify\design-explore\watchdog-local-cloud-flow.html
echo CORPUS-DONE
exit /b 0
:run
echo [...] %1
node tools\archify\scripts\geometry-assert.mjs %2 --viewport 1440x900 > %OUT%\corpus-%1.json 2> %OUT%\corpus-%1.stderr.txt
echo exit:%ERRORLEVEL% %1
exit /b 0
